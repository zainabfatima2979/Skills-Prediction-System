const User = require("../models/User");
const CourseNotice = require("../models/CourseNotice");
const CourseRequest = require("../models/CourseRequest");
const ManagerReview = require("../models/ManagerReview");
const EmployeeProfile = require("../models/EmployeeProfile");

// Overall status of a request, worked out from its departments
const overallStatus = (request) => {
  const total = request.allocations.length;
  const done = request.allocations.filter((a) => a.status === "Submitted").length;
  if (done === 0) return "Pending Manager Selection";
  if (done === total) return "Employees Selected";
  return "Partially Selected";
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "to be announced";

const getManager = (req) =>
  User.findOne({ employeeId: req.user.employeeId }).select("employeeId name department");

// ---------------------------------------------------------------- HR side

// GET /api/hr/course-requests
// Every course request with its status per department and, once a manager
// has submitted, the employees they selected.
const getCourseRequests = async (req, res) => {
  try {
    const requests = await CourseRequest.find().sort({ createdAt: -1 });

    const ids = [...new Set(requests.flatMap((r) => r.allocations.flatMap((a) => a.selectedEmployeeIds)))];
    const users = await User.find({ employeeId: { $in: ids } }).select("employeeId name designation");
    const userMap = Object.fromEntries(users.map((u) => [u.employeeId, u]));

    res.json(
      requests.map((r) => ({
        _id: r._id,
        skill: r.skill,
        courseName: r.courseName,
        requiredLevel: r.requiredLevel,
        duration: r.duration,
        startDate: r.startDate,
        createdAt: r.createdAt,
        status: overallStatus(r),
        allocations: r.allocations.map((a) => ({
          department: a.department,
          seats: a.seats,
          status: a.status,
          submittedAt: a.submittedAt,
          selectedEmployees: a.selectedEmployeeIds.map(
            (id) => userMap[id] || { employeeId: id, name: id, designation: "-" }
          ),
        })),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course requests", error: error.message });
  }
};

// ----------------------------------------------------------- Manager side

// Where the manager stands on rating this course's skill.
// Only ratings made AFTER the course request was created count, so the
// manager has to rate every employee on this skill for this course.
// Employees without a completed profile cannot be rated by the system
// (the review form blocks them), so they are listed separately instead of
// blocking the manager forever.
async function ratingProgress(request, department) {
  const employees = await User.find({
    role: "employee",
    isActive: { $ne: false },
    department,
  }).select("employeeId name designation");
  const ids = employees.map((e) => e.employeeId);

  const [profiles, reviews] = await Promise.all([
    EmployeeProfile.find({ employeeId: { $in: ids } }).select("employeeId"),
    ManagerReview.find({
      employeeId: { $in: ids },
      skill: request.skill,
      reviewDate: { $gte: request.createdAt },
    }).sort({ reviewDate: -1 }),
  ]);

  const hasProfile = new Set(profiles.map((p) => p.employeeId));
  const ratingMap = {};
  reviews.forEach((r) => {
    if (!(r.employeeId in ratingMap)) ratingMap[r.employeeId] = r.rating; // newest first
  });

  const rateable = employees.filter((e) => hasProfile.has(e.employeeId));
  const noProfile = employees.filter((e) => !hasProfile.has(e.employeeId));
  const unrated = rateable.filter((e) => !(e.employeeId in ratingMap));

  return { rateable, noProfile, unrated, ratingMap };
}

// The view of one department inside a request: its seats, status, rating
// progress and the employees (lowest rating first = needs training most).
async function departmentView(request, alloc) {
  const p = await ratingProgress(request, alloc.department);
  const candidates = p.rateable
    .map((e) => ({
      employeeId: e.employeeId,
      name: e.name,
      designation: e.designation,
      rating: p.ratingMap[e.employeeId] ?? null,
    }))
    .sort((a, b) => (a.rating ?? 99) - (b.rating ?? 99));

  return {
    department: alloc.department,
    seats: alloc.seats,
    status: alloc.status,
    selectedEmployeeIds: alloc.selectedEmployeeIds,
    ratingsComplete: p.rateable.length > 0 && p.unrated.length === 0,
    ratedCount: p.rateable.length - p.unrated.length,
    totalToRate: p.rateable.length,
    unrated: p.unrated.map((e) => ({ employeeId: e.employeeId, name: e.name, designation: e.designation })),
    noProfile: p.noProfile.map((e) => ({ employeeId: e.employeeId, name: e.name, designation: e.designation })),
    candidates,
  };
}

// GET /api/manager/course-requests
// Every course request, with all of its departments. Managers in this system
// rate and see employees of every department, so they see every department
// HR asked people from.
const getManagerCourseRequests = async (req, res) => {
  try {
    const requests = await CourseRequest.find().sort({ createdAt: -1 });

    const result = [];
    for (const r of requests) {
      const allocations = [];
      for (const a of r.allocations) {
        const p = await ratingProgress(r, a.department);
        allocations.push({
          department: a.department,
          seats: a.seats,
          status: a.status,
          selectedCount: a.selectedEmployeeIds.length,
          ratedCount: p.rateable.length - p.unrated.length,
          totalToRate: p.rateable.length,
          ratingsComplete: p.rateable.length > 0 && p.unrated.length === 0,
        });
      }
      result.push({
        _id: r._id,
        skill: r.skill,
        courseName: r.courseName,
        requiredLevel: r.requiredLevel,
        duration: r.duration,
        startDate: r.startDate,
        createdAt: r.createdAt,
        status: overallStatus(r),
        allocations,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch course requests", error: error.message });
  }
};

// GET /api/manager/course-requests/:id/candidates
// One section per department. For each department the manager must first rate
// every employee on the course skill, then pick who attends.
const getCourseRequestCandidates = async (req, res) => {
  try {
    const request = await CourseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Course request not found" });

    const departments = [];
    for (const a of request.allocations) {
      departments.push(await departmentView(request, a));
    }

    res.json({
      request: {
        _id: request._id,
        skill: request.skill,
        courseName: request.courseName,
        requiredLevel: request.requiredLevel,
        duration: request.duration,
        startDate: request.startDate,
      },
      departments,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

// POST /api/manager/course-requests/:id/select
// Body: { department, employeeIds: [...] }
// Selection is submitted per department. Only allowed after every employee of
// that department has been rated on the course skill. Notifies the selected
// employees and HR.
const submitCourseSelection = async (req, res) => {
  try {
    const { department, employeeIds } = req.body;
    if (!department) return res.status(400).json({ message: "department is required" });
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: "Select at least one employee" });
    }
    const dept = String(department).trim();
    const ids = [...new Set(employeeIds.map((i) => String(i).trim()))];

    const manager = await getManager(req);
    if (!manager) return res.status(404).json({ message: "Manager not found" });

    const request = await CourseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Course request not found" });

    const alloc = request.allocations.find((a) => a.department === dept);
    if (!alloc) return res.status(400).json({ message: `${dept} is not part of this course request` });
    if (alloc.status === "Submitted") {
      return res.status(400).json({ message: `${dept} selection is already submitted for this course` });
    }
    if (ids.length > alloc.seats) {
      return res.status(400).json({ message: `HR asked for ${alloc.seats} person(s) from ${dept}. You selected ${ids.length}.` });
    }

    // Rating gate: every employee of this department must be rated on this skill first
    const p = await ratingProgress(request, dept);
    if (p.rateable.length === 0) {
      return res.status(400).json({ message: `No employees in ${dept} can be rated yet` });
    }
    if (p.unrated.length > 0) {
      return res.status(400).json({
        message: `Rate all ${dept} employees on "${request.skill}" first. ${p.unrated.length} still left.`,
      });
    }

    // Only rated, active employees of this department can be selected
    const rateableIds = new Set(p.rateable.map((e) => e.employeeId));
    if (!ids.every((id) => rateableIds.has(id))) {
      return res.status(400).json({ message: `Some selected employees are not valid for ${dept}` });
    }
    const employees = p.rateable.filter((e) => ids.includes(e.employeeId));

    // Atomic: only succeeds if this department is still Pending (blocks double submit)
    const updated = await CourseRequest.findOneAndUpdate(
      { _id: request._id, allocations: { $elemMatch: { department: dept, status: "Pending" } } },
      {
        $set: {
          "allocations.$.status": "Submitted",
          "allocations.$.selectedEmployeeIds": ids,
          "allocations.$.submittedBy": manager.employeeId,
          "allocations.$.submittedAt": new Date(),
        },
      },
      { new: true }
    );
    if (!updated) {
      return res.status(400).json({ message: `${dept} selection is already submitted for this course` });
    }

    const when = formatDate(request.startDate);

    // 1. Notify each selected employee
    await CourseNotice.insertMany(
      employees.map((e) => ({
        employeeId: e.employeeId,
        skill: request.skill,
        courseName: request.courseName,
        message:
          `You have been selected for the course "${request.courseName}" by ${manager.name}. ` +
          `Duration: ${request.duration}. Start date: ${when}.`,
        sentBy: manager.employeeId,
      }))
    );

    // 2. Notify HR with the full list
    const list = employees.map((e) => `${e.name} (${e.employeeId})`).join(", ");
    await CourseNotice.create({
      employeeId: request.createdBy,
      skill: request.skill,
      courseName: request.courseName,
      message:
        `${manager.name} selected ${employees.length} employee(s) from ${dept} for ` +
        `"${request.courseName}": ${list}.`,
      sentBy: manager.employeeId,
    });

    res.json({
      message: `${dept}: selection submitted. ${employees.length} employee(s) and HR have been notified.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit selection", error: error.message });
  }
};

module.exports = {
  getCourseRequests,
  getManagerCourseRequests,
  getCourseRequestCandidates,
  submitCourseSelection,
};
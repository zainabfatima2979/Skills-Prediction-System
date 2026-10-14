const User = require("../models/User");
const Course = require("../models/Course");
const CourseRecommendation = require("../models/CourseRecommendation");
const CourseNotice = require("../models/CourseNotice");

// Active employees whose current skill gap is the skill this course covers
async function needersOf(course) {
  const recs = await CourseRecommendation.find({ skillGap: course.skill });
  const users = await User.find({
    employeeId: { $in: recs.map((r) => r.employeeId) },
    role: "employee",
    isActive: { $ne: false },
  }).select("employeeId name department designation");
  return { recs, users };
}

// GET /api/manager/courses
// Every course, with how many employees currently need it and how many of
// them the manager has already messaged.
const getCoursesForManager = async (req, res) => {
  try {
    const courses = await Course.find().sort({ skill: 1 });
    const result = [];

    for (const c of courses) {
      const { users } = await needersOf(c);
      const ids = users.map((u) => u.employeeId);
      const notified = ids.length
        ? await CourseNotice.distinct("employeeId", {
            employeeId: { $in: ids },
            skill: c.skill,
            courseName: c.courseName,
          })
        : [];

      result.push({
        _id: c._id,
        skill: c.skill,
        courseName: c.courseName,
        departments: c.departments && c.departments.length > 0 ? c.departments : c.department ? [c.department] : [],
        needCount: ids.length,
        notifiedCount: notified.length,
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses", error: error.message });
  }
};

// GET /api/manager/courses/:id/needed-by?department=Production
// The employees who need this course, optionally for one department.
const getCourseNeeders = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const { recs, users } = await needersOf(course);
    const departments = [...new Set(users.map((u) => u.department))].sort();

    const { department } = req.query;
    const shown = department ? users.filter((u) => u.department === department) : users;

    const notices = await CourseNotice.find({
      employeeId: { $in: shown.map((u) => u.employeeId) },
      skill: course.skill,
      courseName: course.courseName,
    }).select("employeeId");
    const notifiedIds = new Set(notices.map((n) => n.employeeId));
    const recMap = Object.fromEntries(recs.map((r) => [r.employeeId, r]));

    const employees = shown
      .map((u) => ({
        employeeId: u.employeeId,
        name: u.name,
        department: u.department,
        designation: u.designation,
        priority: recMap[u.employeeId]?.priority ?? 0,
        alreadyNotified: notifiedIds.has(u.employeeId),
      }))
      .sort((a, b) => b.priority - a.priority);

    res.json({
      course: { _id: course._id, skill: course.skill, courseName: course.courseName },
      departments,
      employees,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees for this course", error: error.message });
  }
};

// POST /api/manager/courses/:id/notify
// Body: { employeeIds: [...], message }
// The manager picks any of the employees who need this course and sends them
// the message. Anyone already notified about this course is skipped so nobody
// gets the same message twice.
const sendCourseNotice = async (req, res) => {
  try {
    const { employeeIds, message } = req.body;
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ message: "Select at least one employee" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const { users } = await needersOf(course);
    const needers = new Set(users.map((u) => u.employeeId));
    const validIds = [...new Set(employeeIds.map((i) => String(i).trim()))].filter((id) => needers.has(id));

    const existing = await CourseNotice.find({
      employeeId: { $in: validIds },
      skill: course.skill,
      courseName: course.courseName,
    }).select("employeeId");
    const alreadyIds = new Set(existing.map((n) => n.employeeId));
    const toSend = validIds.filter((id) => !alreadyIds.has(id));

    if (toSend.length > 0) {
      await CourseNotice.insertMany(
        toSend.map((employeeId) => ({
          employeeId,
          skill: course.skill,
          courseName: course.courseName,
          message: message.trim(),
          sentBy: req.user.employeeId,
        }))
      );
    }

    const skipped = employeeIds.length - toSend.length;
    res.json({
      message:
        `Message sent to ${toSend.length} employee(s)` +
        (skipped > 0 ? `, ${skipped} skipped (already notified or not needing this course)` : ""),
      sent: toSend.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
};

module.exports = { getCoursesForManager, getCourseNeeders, sendCourseNotice };
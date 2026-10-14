const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SkillPrediction = require("../models/SkillPrediction");
const ManagerReview = require("../models/ManagerReview");
const RequiredSkill = require("../models/RequiredSkill");
const EmployeeProfile = require("../models/EmployeeProfile");
const CourseRecommendation = require("../models/CourseRecommendation");
const Course = require("../models/Course");
const SkillPredictionHistory = require("../models/SkillPredictionHistory");
const { runPredictionForEmployee } = require("../utils/predictionService");
const CourseNotice = require("../models/CourseNotice");
const CourseRequest = require("../models/CourseRequest");

// GET /api/hr/employees?department=IT (department filter optional)
// Lists every employee with a quick summary: how many skills are OK, Gap, or Pending
const getAllEmployees = async (req, res) => {
  try {
    const filter = { role: "employee", isActive: { $ne: false } };
    if (req.query.department) filter.department = req.query.department;

    const employees = await User.find(filter).select(
      "employeeId name department designation"
    );

    const requiredSkills = await RequiredSkill.find();

    const summaries = await Promise.all(
      employees.map(async (emp) => {
        const predictions = await SkillPrediction.find({ employeeId: emp.employeeId });
        const predictionBySkill = Object.fromEntries(predictions.map((p) => [p.skill, p]));

        const skillsForDesignation = requiredSkills.filter(
          (r) => r.designation === emp.designation
        );

        let okCount = 0;
        let gapCount = 0;
        let pendingCount = 0;

        skillsForDesignation.forEach((req) => {
          const p = predictionBySkill[req.skill];
          if (!p || p.status === "Review Pending") pendingCount++;
          else if (p.status === "OK") okCount++;
          else if (p.status === "Gap") gapCount++;
        });

        return {
          employeeId: emp.employeeId,
          name: emp.name,
          department: emp.department,
          designation: emp.designation,
          totalSkills: skillsForDesignation.length,
          okCount,
          gapCount,
          pendingCount,
        };
      })
    );

    res.json(summaries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

// GET /api/hr/dashboard
// One-page organization overview: totals, top skill gaps, level distribution, pending reviews
const getDashboard = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: "employee", isActive: { $ne: false } });

    // Every skill that has a gap across the whole organization, biggest first
    // (the dashboard shows the top 5 and lets HR expand to see the rest)
    const topGaps = await SkillPrediction.aggregate([
      { $match: { status: "Gap" } },
      { $group: { _id: "$skill", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { skill: "$_id", count: 1, _id: 0 } },
    ]);

    // How many predictions fall into each level (for a bar/pie chart)
    const levelAggregate = await SkillPrediction.aggregate([
      { $match: { predictedLevel: { $ne: null } } },
      { $group: { _id: "$predictedLevel", count: { $sum: 1 } } },
    ]);

    // Always show all three levels, even ones with zero predictions so far
    const levelOrder = ["Beginner", "Intermediate", "Advanced"];
    const levelDistribution = levelOrder.map((level) => {
      const found = levelAggregate.find((l) => l._id === level);
      return { level, count: found ? found.count : 0 };
    });

    // Employees who have at least one skill still "pending" - either explicitly
    // marked Review Pending, or because they've never run a prediction at all
    const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select(
      "employeeId name department designation"
    );
    const requiredSkills = await RequiredSkill.find();
    const allPredictions = await SkillPrediction.find({
      employeeId: { $in: employees.map((e) => e.employeeId) },
    });

    const predictionMap = {};
    allPredictions.forEach((p) => {
      if (!predictionMap[p.employeeId]) predictionMap[p.employeeId] = {};
      predictionMap[p.employeeId][p.skill] = p;
    });

    const pendingEmployees = employees.filter((emp) => {
      const skillsForDesignation = requiredSkills.filter(
        (r) => r.designation === emp.designation
      );
      return skillsForDesignation.some((req) => {
        const existing = predictionMap[emp.employeeId]?.[req.skill];
        return !existing || existing.status === "Review Pending";
      });
    }).map((e) => ({
      employeeId: e.employeeId,
      name: e.name,
      department: e.department,
      designation: e.designation,
    }));

    res.json({
      totalEmployees,
      topGaps,
      levelDistribution,
      pendingReviewEmployees: pendingEmployees,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to build dashboard", error: error.message });
  }
};

// GET /api/hr/required-skills
const getRequiredSkills = async (req, res) => {
  try {
    const skills = await RequiredSkill.find();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch required skills", error: error.message });
  }
};

// POST /api/hr/required-skills
// Body: { designation, department, skill, requiredLevel }
const addRequiredSkill = async (req, res) => {
  try {
    const { designation, department, skill, requiredLevel } = req.body;
    if (!designation || !department || !skill || !requiredLevel) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const created = await RequiredSkill.create({
      designation,
      department,
      skill,
      requiredLevel,
    });

    res.status(201).json({ message: "Required skill added", skill: created });
  } catch (error) {
    res.status(500).json({ message: "Failed to add required skill", error: error.message });
  }
};

// POST /api/hr/create-user
// Only HR can create new accounts (employee, manager, or another HR user)
// GET /api/hr/check-employee-id/:employeeId
// Used by the Create Account form for live, as-you-type validation -
// tells the frontend immediately whether this ID is already taken,
// before the form is even submitted.
const checkEmployeeIdAvailable = async (req, res) => {
  try {
    const employeeId = req.params.employeeId.trim();
    if (!employeeId) return res.json({ available: true });

    const escaped = employeeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await User.findOne({ employeeId: new RegExp(`^${escaped}$`, "i") });

    res.json({ available: !existing });
  } catch (error) {
    res.status(500).json({ message: "Failed to check employee ID", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    let { employeeId, name, email, password, role, department, designation } = req.body;

    if (!employeeId || !name || !email || !password || !role || !department || !designation) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Trim whitespace so accidental spaces (e.g. "IT-200 ") never cause a mismatch later
    employeeId = employeeId.trim();
    name = name.trim();
    email = email.trim();
    department = department.trim();
    designation = designation.trim();

    // Check employeeId and email separately so HR gets a precise reason,
    // instead of a generic "something already exists" message.
    // Case-insensitive: "FRO-126" and "fro-126" must count as the same ID,
    // no matter which department each attempt used.
    const idRegex = new RegExp(`^${employeeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const existingById = await User.findOne({ employeeId: idRegex });
    if (existingById) {
      return res.status(400).json({
        message: `Employee ID "${employeeId}" is already registered.`,
      });
    }

    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const existingByEmail = await User.findOne({ email: emailRegex });
    if (existingByEmail) {
      return res.status(400).json({
        message: "This email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      role,
      department,
      designation,
    });

    res.status(201).json({
      message: `Account created for ${user.name} (${user.role})`,
      user: {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    // Safety net for a race condition: two requests passing the checks above
    // at nearly the same instant. MongoDB's unique index still blocks the
    // second insert (error code 11000) - turn that into a clean message
    // instead of a raw database error.
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "employeeId";
      return res.status(400).json({
        message: field === "email"
          ? "This email is already in use. Please use a different one."
          : "This Employee ID is already in use. Please use a different one.",
      });
    }
    res.status(500).json({ message: "Failed to create account", error: error.message });
  }
};

// DELETE /api/hr/users/:employeeId
// Deactivates the account instead of deleting it: the person can no longer
// log in, but their profile, reviews, predictions and history all stay in
// the database exactly as they are, for record-keeping.
const deactivateUser = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (employeeId.trim() === req.user.employeeId.trim()) {
      return res.status(400).json({ message: "You cannot deactivate your own account while logged in" });
    }

    const user = await User.findOneAndUpdate(
      { employeeId: whitespaceTolerantMatch(employeeId) },
      { isActive: false },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `${user.name}'s account has been deactivated` });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate user", error: error.message });
  }
};

// PUT /api/hr/users/:employeeId/reactivate
// Restores login access for a previously deactivated account
const reactivateUser = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const user = await User.findOneAndUpdate(
      { employeeId: whitespaceTolerantMatch(employeeId) },
      { isActive: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: `${user.name}'s account has been reactivated` });
  } catch (error) {
    res.status(500).json({ message: "Failed to reactivate user", error: error.message });
  }
};

// GET /api/hr/employees/deactivated
// Lists every deactivated employee, so HR can view their history or reactivate them
const getDeactivatedEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: false }).select(
      "employeeId name department designation updatedAt"
    );
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch deactivated employees", error: error.message });
  }
};

// GET /api/hr/predictions?status=OK|Gap|Review Pending
// Returns every prediction with that status across the whole organization,
// with employee details attached, for the sidebar drill-down pages.
const getPredictionsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const validStatuses = ["OK", "Gap", "Review Pending"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(", ")}` });
    }

    // "Review Pending" needs special handling: an employee who has NEVER run a
    // prediction has no SkillPrediction record at all yet - not just one marked
    // "Review Pending". Both cases mean the same thing to HR: still needs review.
    if (status === "Review Pending") {
      const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select(
        "employeeId name department designation"
      );
      const requiredSkills = await RequiredSkill.find();
      const allPredictions = await SkillPrediction.find({
        employeeId: { $in: employees.map((e) => e.employeeId) },
      });

      const predictionMap = {};
      allPredictions.forEach((p) => {
        if (!predictionMap[p.employeeId]) predictionMap[p.employeeId] = {};
        predictionMap[p.employeeId][p.skill] = p;
      });

      const results = [];
      for (const emp of employees) {
        const skillsForDesignation = requiredSkills.filter(
          (r) => r.designation === emp.designation
        );
        for (const req of skillsForDesignation) {
          const existing = predictionMap[emp.employeeId]?.[req.skill];
          const isPending = !existing || existing.status === "Review Pending";
          if (isPending) {
            results.push({
              employeeId: emp.employeeId,
              name: emp.name,
              designation: emp.designation,
              department: emp.department,
              skill: req.skill,
              predictedScore: existing ? existing.predictedScore : null,
              predictedLevel: existing ? existing.predictedLevel : null,
              requiredLevel: req.requiredLevel,
              reviewDate: existing ? existing.reviewDate : null,
            });
          }
        }
      }

      return res.json(results);
    }

    // OK and Gap only make sense for skills that actually have a real prediction
    const predictions = await SkillPrediction.find({ status }).sort({ reviewDate: -1 });

    const employeeIds = [...new Set(predictions.map((p) => p.employeeId))];
    const users = await User.find({ employeeId: { $in: employeeIds } }).select(
      "employeeId name department designation"
    );
    const userMap = Object.fromEntries(users.map((u) => [u.employeeId, u]));

    const results = predictions.map((p) => ({
      employeeId: p.employeeId,
      name: userMap[p.employeeId]?.name || "Unknown",
      designation: userMap[p.employeeId]?.designation || "-",
      department: userMap[p.employeeId]?.department || "-",
      skill: p.skill,
      predictedScore: p.predictedScore,
      predictedLevel: p.predictedLevel,
      requiredLevel: p.requiredLevel,
      reviewDate: p.reviewDate,
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch predictions", error: error.message });
  }
};

// Case-sensitive but whitespace-tolerant lookup: matches "IT-200" against a
// stored value of "IT-200 " (trailing space) from before the trim fix existed.
function whitespaceTolerantMatch(employeeId) {
  const escaped = employeeId.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*${escaped}\\s*$`);
}

// GET /api/hr/users/:employeeId
// Fetches one user's full details for the edit form
const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      employeeId: whitespaceTolerantMatch(req.params.employeeId),
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

// PUT /api/hr/users/:employeeId
// Updates name, email, department, designation, or role for an existing account
const updateUser = async (req, res) => {
  try {
    let { name, email, department, designation, role } = req.body;

    const user = await User.findOne({
      employeeId: whitespaceTolerantMatch(req.params.employeeId),
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Also fix the employeeId itself if it had stray whitespace
    user.employeeId = user.employeeId.trim();
    if (name) user.name = name.trim();
    if (email) user.email = email.trim();
    if (department) user.department = department.trim();
    if (designation) user.designation = designation.trim();
    if (role) user.role = role;

    await user.save();

    res.json({
      message: `Updated account for ${user.name}`,
      user: {
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

// GET /api/hr/prediction-status
// Splits employees into those who have run at least one prediction, and
// those who have never run one at all (no SkillPrediction records exist)
const getPredictionStatus = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select(
      "employeeId name department designation"
    );

    const allPredictions = await SkillPrediction.find({
      employeeId: { $in: employees.map((e) => e.employeeId) },
    }).select("employeeId");

    const predictedIds = new Set(allPredictions.map((p) => p.employeeId));

    const predicted = [];
    const notPredicted = [];

    employees.forEach((emp) => {
      const entry = {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
      };
      if (predictedIds.has(emp.employeeId)) predicted.push(entry);
      else notPredicted.push(entry);
    });

    res.json({ predicted, notPredicted, totalEmployees: employees.length });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch prediction status", error: error.message });
  }
};

// GET /api/hr/courses
// Lists the full skill-to-course catalog, along with which designations
// (and departments) currently require each skill
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ skill: 1 });
    const requiredSkills = await RequiredSkill.find();

    const results = courses.map((c) => {
      const matches = requiredSkills.filter((r) => r.skill === c.skill);
      return {
        _id: c._id,
        skill: c.skill,
        courseName: c.courseName,
        department: c.department || null,
        departments: c.departments || [],
        duration: c.duration || "",
        startDate: c.startDate || null,
        usedIn: matches.map((m) => ({ designation: m.designation, department: m.department })),
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses", error: error.message });
  }
};

// POST /api/hr/courses
// Body: { skill, courseName, requiredLevel, duration, startDate,
//         allocations: [{ department, seats }] }
// Saves the course and a CourseRequest that goes to the managers of the chosen
// departments. Employees are NOT notified here - each manager picks people
// first, then the selected employees and HR are notified (see
// courseRequestController.submitCourseSelection).
// The skill still becomes a REQUIRED skill for the chosen departments so it
// shows up in the manager's review form and in predictions.
const addCourse = async (req, res) => {
  try {
    const { skill, courseName, requiredLevel, duration, startDate, allocations } = req.body;
    if (!skill || !courseName) {
      return res.status(400).json({ message: "skill and courseName are required" });
    }
    if (!duration || !duration.trim()) {
      return res.status(400).json({ message: "Please enter the course duration" });
    }
    if (!startDate || isNaN(new Date(startDate).getTime())) {
      return res.status(400).json({ message: "Please select a valid start date" });
    }
    if (!["Beginner", "Intermediate", "Advanced"].includes(requiredLevel)) {
      return res.status(400).json({ message: "Please select the required level" });
    }
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ message: "Select at least one department" });
    }

    // Clean the allocations: trimmed names, whole numbers >= 1, no duplicate departments
    const seen = new Set();
    const cleaned = [];
    for (const a of allocations) {
      const dept = String(a.department || "").trim();
      const seats = Number(a.seats);
      if (!dept) return res.status(400).json({ message: "Every selected department needs a name" });
      if (!Number.isInteger(seats) || seats < 1) {
        return res.status(400).json({ message: `Enter how many persons are needed from ${dept} (1 or more)` });
      }
      if (seen.has(dept)) return res.status(400).json({ message: `${dept} is selected twice` });
      seen.add(dept);
      cleaned.push({ department: dept, seats });
    }

    const existing = await Course.findOne({ skill: skill.trim() });
    if (existing) {
      return res.status(400).json({ message: `A course is already mapped to "${skill}". Delete it first to replace it.` });
    }

    // Every department must have enough active employees to fill its seats
    for (const a of cleaned) {
      const count = await User.countDocuments({ role: "employee", isActive: { $ne: false }, department: a.department });
      if (count === 0) return res.status(400).json({ message: `${a.department} has no active employees` });
      if (a.seats > count) {
        return res.status(400).json({ message: `${a.department} has only ${count} active employee(s), but you asked for ${a.seats}` });
      }
    }

    const deptNames = cleaned.map((a) => a.department);
    const course = await Course.create({
      skill: skill.trim(),
      courseName: courseName.trim(),
      department: deptNames.length === 1 ? deptNames[0] : null,
      departments: deptNames,
      duration: duration.trim(),
      startDate: new Date(startDate),
    });

    await CourseRequest.create({
      courseId: course._id,
      skill: course.skill,
      courseName: course.courseName,
      requiredLevel,
      duration: duration.trim(),
      startDate: new Date(startDate),
      allocations: cleaned,
      createdBy: req.user.employeeId,
    });

    // Required skill for each distinct (designation, department) pair
    const employees = await User.find({
      role: "employee",
      isActive: { $ne: false },
      department: { $in: deptNames },
    }).select("designation department");

    const pairs = new Map();
    employees.forEach((e) => {
      pairs.set(`${e.designation}|${e.department}`, { designation: e.designation, department: e.department });
    });

    const existingSkills = await RequiredSkill.find({ skill: course.skill }).select("designation department");
    const existingKeys = new Set(existingSkills.map((r) => `${r.designation}|${r.department}`));

    const newRequired = [...pairs.entries()]
      .filter(([key]) => !existingKeys.has(key))
      .map(([, p]) => ({
        designation: p.designation,
        department: p.department,
        skill: course.skill,
        requiredLevel,
      }));
    if (newRequired.length > 0) await RequiredSkill.insertMany(newRequired);

    res.status(201).json({
      message:
        `Course added and sent to the manager(s) of ${deptNames.join(", ")}. ` +
        `Employees will be notified once the managers select them.`,
      course,
      requiredSkillsAdded: newRequired.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add course", error: error.message });
  }
};

// DELETE /api/hr/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: `Removed course mapping for "${course.skill}"` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete course", error: error.message });
  }
};

// GET /api/hr/course-recommendations
// Every currently-recommended course across all employees, with their
// department and designation attached
const getAllCourseRecommendations = async (req, res) => {
  try {
    const recommendations = await CourseRecommendation.find().sort({ priority: -1 });

    const employeeIds = [...new Set(recommendations.map((r) => r.employeeId))];
    const users = await User.find({ employeeId: { $in: employeeIds } }).select(
      "employeeId name department designation"
    );
    const userMap = Object.fromEntries(users.map((u) => [u.employeeId, u]));

    const results = recommendations.map((r) => ({
      employeeId: r.employeeId,
      name: userMap[r.employeeId]?.name || "Unknown",
      designation: userMap[r.employeeId]?.designation || "-",
      department: userMap[r.employeeId]?.department || "-",
      skillGap: r.skillGap,
      recommendedCourse: r.recommendedCourse,
      confidence: r.confidence,
      priority: r.priority,
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: error.message });
  }
};

// GET /api/hr/skill-history/:employeeId
// The full prediction history for one employee, for HR to view their trend
const getEmployeeHistory = async (req, res) => {
  try {
    const employee = await User.findOne({ employeeId: req.params.employeeId }).select(
      "employeeId name department designation"
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const history = await SkillPredictionHistory.find({
      employeeId: req.params.employeeId,
    }).sort({ recordedAt: 1 });

    res.json({ employee, history });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
};

// POST /api/hr/predict/:employeeId
// HR runs the skill prediction for one employee. Results are saved to
// SkillPrediction, SkillPredictionHistory and CourseRecommendation,
// and the employee then sees them on their own dashboard.
const predictForEmployee = async (req, res) => {
  try {
    const employeeId = req.params.employeeId.trim();
    const user = await User.findOne({ employeeId: whitespaceTolerantMatch(employeeId), role: "employee" });
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const predictions = await runPredictionForEmployee(user.employeeId);
    res.json({ message: `Prediction complete for ${user.name}`, predictions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/hr/predict-all
// Runs the prediction for every employee. Employees who can't be predicted
// (no profile yet, no required skills for their designation) are skipped and
// returned in `failed` with the reason, instead of stopping the whole run.
const predictForAll = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select("employeeId name");
    const succeeded = [];
    const failed = [];

    for (const emp of employees) {
      try {
        await runPredictionForEmployee(emp.employeeId);
        succeeded.push(emp.employeeId);
      } catch (err) {
        failed.push({ employeeId: emp.employeeId, name: emp.name, reason: err.message });
      }
    }

    res.json({
      message: `Prediction done for ${succeeded.length} employee(s), ${failed.length} skipped`,
      succeeded,
      failed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hr/employee-detail/:employeeId
// Everything HR needs on the employee detail page in one call:
// account info, the profile the employee filled in, current predictions
// and current course recommendations.
const getEmployeeDetail = async (req, res) => {
  try {
    const user = await User.findOne({
      employeeId: whitespaceTolerantMatch(req.params.employeeId),
      role: "employee",
    }).select("-password");
    if (!user) return res.status(404).json({ message: "Employee not found" });

    const [profile, predictions, recommendations] = await Promise.all([
      EmployeeProfile.findOne({ employeeId: user.employeeId }),
      SkillPrediction.find({ employeeId: user.employeeId }).sort({ skill: 1 }),
      CourseRecommendation.find({ employeeId: user.employeeId }).sort({ priority: -1 }),
    ]);

    res.json({ user, profile, predictions, recommendations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee detail", error: error.message });
  }
};

// GET /api/hr/departments
// Distinct department names (from employee accounts), for the department dropdowns
const getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct("department", { role: "employee" });
    res.json(departments.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch departments", error: error.message });
  }
};

// GET /api/hr/skill-heatmap
// A department x skill grid. Each cell shows what percentage of that
// department's employees have a Gap in that skill, so HR can see the
// weakest spots across the whole organization at a glance.
const getSkillHeatmap = async (req, res) => {
  try {
    const rows = await SkillPrediction.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "employeeId",
          foreignField: "employeeId",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.role": "employee", "user.isActive": { $ne: false } } },
      {
        $group: {
          _id: { department: "$user.department", skill: "$skill" },
          total: { $sum: 1 },
          gaps: { $sum: { $cond: [{ $eq: ["$status", "Gap"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Review Pending"] }, 1, 0] } },
        },
      },
    ]);

    const departments = [...new Set(rows.map((r) => r._id.department))].sort();
    const skills = [...new Set(rows.map((r) => r._id.skill))].sort();

    const cellMap = {};
    rows.forEach((r) => {
      const key = `${r._id.department}|${r._id.skill}`;
      cellMap[key] = {
        department: r._id.department,
        skill: r._id.skill,
        total: r.total,
        gaps: r.gaps,
        pending: r.pending,
        gapPercent: r.total > 0 ? Math.round((r.gaps / r.total) * 100) : 0,
      };
    });

    res.json({ departments, skills, cells: Object.values(cellMap) });
  } catch (error) {
    res.status(500).json({ message: "Failed to build skill heatmap", error: error.message });
  }
};

// GET /api/hr/course-roi
// For every course HR has sent notices for, compares each notified employee's
// skill score just before the notice to their score after it, to show whether
// the course actually helped. This only uses prediction history that already
// exists - it works even without a separate "mark as completed" step.
const getCourseROI = async (req, res) => {
  try {
    const courses = await Course.find();
    const results = [];

    for (const course of courses) {
      const notices = await CourseNotice.find({
        skill: course.skill,
        courseName: course.courseName,
      }).select("employeeId createdAt");

      const employees = [];

      for (const notice of notices) {
        const history = await SkillPredictionHistory.find({
          employeeId: notice.employeeId,
          skill: course.skill,
          predictedScore: { $ne: null },
        }).sort({ recordedAt: 1 });

        const before = [...history].reverse().find((h) => h.recordedAt <= notice.createdAt);
        const after = history.find((h) => h.recordedAt > notice.createdAt);

        if (before && after) {
          employees.push({
            employeeId: notice.employeeId,
            beforeScore: before.predictedScore,
            afterScore: after.predictedScore,
            improvement: Math.round((after.predictedScore - before.predictedScore) * 10) / 10,
          });
        }
      }

      if (employees.length > 0) {
        const users = await User.find({
          employeeId: { $in: employees.map((e) => e.employeeId) },
        }).select("employeeId name department");
        const nameMap = Object.fromEntries(users.map((u) => [u.employeeId, u]));

        employees.forEach((e) => {
          e.name = nameMap[e.employeeId]?.name || e.employeeId;
          e.department = nameMap[e.employeeId]?.department || "-";
        });

        const avgImprovement =
          Math.round(
            (employees.reduce((sum, e) => sum + e.improvement, 0) / employees.length) * 10
          ) / 10;

        results.push({
          skill: course.skill,
          courseName: course.courseName,
          employeesEvaluated: employees.length,
          avgImprovement,
          employees: employees.sort((a, b) => b.improvement - a.improvement),
        });
      } else {
        results.push({
          skill: course.skill,
          courseName: course.courseName,
          employeesEvaluated: 0,
          avgImprovement: null,
          employees: [],
        });
      }
    }

    results.sort((a, b) => (b.avgImprovement ?? -999) - (a.avgImprovement ?? -999));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Failed to calculate course ROI", error: error.message });
  }
};

// GET /api/hr/status-counts
// Exact counts behind the "Pending Reviews", "Skill Gaps", and "Meeting
// Requirement" sidebar links, shared by every HR page so the sidebar can
// show live numbers without each page recomputing this itself.
const getStatusCounts = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select(
      "employeeId designation"
    );
    const requiredSkills = await RequiredSkill.find();
    const allPredictions = await SkillPrediction.find({
      employeeId: { $in: employees.map((e) => e.employeeId) },
    });

    const predictionMap = {};
    allPredictions.forEach((p) => {
      if (!predictionMap[p.employeeId]) predictionMap[p.employeeId] = {};
      predictionMap[p.employeeId][p.skill] = p;
    });

    let pending = 0;
    let gap = 0;
    let ok = 0;

    employees.forEach((emp) => {
      const skillsForDesignation = requiredSkills.filter(
        (r) => r.designation === emp.designation
      );
      skillsForDesignation.forEach((req) => {
        const existing = predictionMap[emp.employeeId]?.[req.skill];
        if (!existing || existing.status === "Review Pending") pending++;
        else if (existing.status === "Gap") gap++;
        else if (existing.status === "OK") ok++;
      });
    });

    res.json({ pending, gap, ok });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch status counts", error: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getDashboard,
  getRequiredSkills,
  addRequiredSkill,
  createUser,
  checkEmployeeIdAvailable,
  deactivateUser,
  reactivateUser,
  getDeactivatedEmployees,
  getPredictionsByStatus,
  getUserById,
  updateUser,
  getPredictionStatus,
  getCourses,
  addCourse,
  deleteCourse,
  getAllCourseRecommendations,
  getEmployeeHistory,
  predictForEmployee,
  predictForAll,
  getEmployeeDetail,
  getDepartments,
  getSkillHeatmap,
  getCourseROI,
  getStatusCounts,
};
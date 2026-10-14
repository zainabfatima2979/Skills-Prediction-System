const ManagerReview = require("../models/ManagerReview");
const RequiredSkill = require("../models/RequiredSkill");
const User = require("../models/User");
const EmployeeProfile = require("../models/EmployeeProfile");

// POST /api/manager/review
// Body: { employeeId, reviews: [{ skill, rating, comment }], overallRemark }
// Creates one ManagerReview document per skill rated
const submitReview = async (req, res) => {
  try {
    const managerId = req.user.employeeId; // the logged-in manager
    const { employeeId, reviews, overallRemark } = req.body;

    if (!employeeId || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        message: "employeeId and a non-empty reviews array are required",
      });
    }

    const employee = await User.findOne({ employeeId, role: "employee", isActive: { $ne: false } });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const profile = await EmployeeProfile.findOne({ employeeId });
    if (!profile) {
      return res.status(400).json({
        message: `${employee.name} hasn't completed their profile yet. They must fill it in before you can rate them.`,
      });
    }

    const savedReviews = [];
    for (const item of reviews) {
      if (!item.skill || !item.rating) continue;

      const review = await ManagerReview.create({
        employeeId,
        managerId,
        skill: item.skill,
        rating: item.rating,
        comment: item.comment || "",
        overallRemark: overallRemark || "",
      });
      savedReviews.push(review);
    }

    res.status(201).json({
      message: `Saved ${savedReviews.length} skill reviews for ${employee.name}`,
      reviews: savedReviews,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit review", error: error.message });
  }
};

// GET /api/manager/team/:employeeId
// Returns the latest review per skill for one employee, plus what skills are required
const getEmployeeReviews = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findOne({
      employeeId,
      role: "employee",
      isActive: { $ne: false },
    }).select("name designation department");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const requiredSkills = await RequiredSkill.find({
      designation: employee.designation,
    });

    const profile = await EmployeeProfile.findOne({ employeeId }).select(
      "-_id -employeeId -__v -createdAt -updatedAt"
    );

    const reviews = await ManagerReview.find({ employeeId }).sort({
      reviewDate: -1,
    });

    res.json({ employee, requiredSkills, profile, reviews });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews", error: error.message });
  }
};

// GET /api/manager/employees
// Lists all employees so the manager can pick one to review.
// Deactivated employees are left out - a manager should never be able to
// rate or even see someone who can no longer log in.
const getAllEmployeesForManager = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select(
      "employeeId name department designation"
    );
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

// GET /api/manager/overview
// Splits all ACTIVE employees into "completed" (every required skill has
// been reviewed by someone) and "pending" (at least one required skill
// missing a review). Deactivated employees never appear here - once HR
// deactivates someone, they disappear from the manager's workload, and
// reappear automatically the moment HR reactivates them.
const getOverview = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: { $ne: false } }).select(
      "employeeId name department designation"
    );
    const requiredSkills = await RequiredSkill.find();
    const allReviews = await ManagerReview.find().select("employeeId skill");

    const reviewedSet = new Set(allReviews.map((r) => `${r.employeeId}|${r.skill}`));

    const completed = [];
    const pending = [];

    employees.forEach((emp) => {
      const skillsForDesignation = requiredSkills.filter(
        (r) => r.designation === emp.designation
      );
      const total = skillsForDesignation.length;
      const reviewed = skillsForDesignation.filter((r) =>
        reviewedSet.has(`${emp.employeeId}|${r.skill}`)
      ).length;

      const entry = {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        reviewed,
        total,
      };

      if (total > 0 && reviewed === total) completed.push(entry);
      else pending.push(entry);
    });

    res.json({ completed, pending });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch overview", error: error.message });
  }
};

// GET /api/manager/history
// Every skill that has been reviewed at least once, showing the latest
// rating, comment, and required level per employee-skill pair.
// This intentionally still shows deactivated employees too - it is a
// historical record of ratings already given, not a to-do list, so there
// is no reason to hide past reviews just because the account is now
// deactivated.
const getReviewHistory = async (req, res) => {
  try {
    const reviews = await ManagerReview.find().sort({ reviewDate: -1 });

    const employeeIds = [...new Set(reviews.map((r) => r.employeeId))];
    const users = await User.find({ employeeId: { $in: employeeIds } }).select(
      "employeeId name department designation"
    );
    const userMap = Object.fromEntries(users.map((u) => [u.employeeId, u]));

    const requiredSkills = await RequiredSkill.find();
    const requiredMap = {};
    requiredSkills.forEach((r) => {
      requiredMap[`${r.designation}|${r.skill}`] = r.requiredLevel;
    });

    // Reviews are sorted newest first, so the first time we see an
    // employeeId+skill pair is automatically the latest one - skip duplicates
    const seen = new Set();
    const latest = [];

    for (const r of reviews) {
      const key = `${r.employeeId}|${r.skill}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const emp = userMap[r.employeeId];
      latest.push({
        employeeId: r.employeeId,
        name: emp?.name || "Unknown",
        designation: emp?.designation || "-",
        department: emp?.department || "-",
        skill: r.skill,
        rating: r.rating,
        comment: r.comment,
        requiredLevel: requiredMap[`${emp?.designation}|${r.skill}`] || "-",
        reviewDate: r.reviewDate,
      });
    }

    res.json(latest);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch review history", error: error.message });
  }
};

module.exports = {
  submitReview,
  getEmployeeReviews,
  getAllEmployeesForManager,
  getOverview,
  getReviewHistory,
};
const EmployeeProfile = require("../models/EmployeeProfile");
const User = require("../models/User");
const SkillPrediction = require("../models/SkillPrediction");
const SkillPredictionHistory = require("../models/SkillPredictionHistory");
const CourseRecommendation = require("../models/CourseRecommendation");
const CourseNotice = require("../models/CourseNotice");

// POST /api/employee/profile
// Creates a new profile, or updates it if one already exists for this employee
const saveProfile = async (req, res) => {
  try {
    const employeeId = req.user.employeeId; // comes from JWT via auth middleware
    const {
      yearsExperience,
      education,
      certifications,
      toolsUsed,
      pastWorkDescription,
      coursesCompleted,
    } = req.body;

    if (yearsExperience === undefined) {
      return res.status(400).json({ message: "yearsExperience is required" });
    }

    const profile = await EmployeeProfile.findOneAndUpdate(
      { employeeId },
      {
        employeeId,
        yearsExperience,
        education,
        certifications,
        toolsUsed,
        pastWorkDescription,
        coursesCompleted,
      },
      { new: true, upsert: true } // create if it doesn't exist yet
    );

    res.status(200).json({ message: "Profile saved successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
};

// GET /api/employee/profile
// Returns the logged-in employee's own profile
const getProfile = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const profile = await EmployeeProfile.findOne({ employeeId });

    if (!profile) {
      return res.status(404).json({ message: "No profile found yet, please create one" });
    }

    // Pull name, designation, department from Users collection so they
    // don't have to be duplicated and kept in sync inside EmployeeProfile
    const user = await User.findOne({ employeeId }).select(
      "name designation department"
    );

    res.json({
      employeeId: profile.employeeId,
      name: user?.name,
      designation: user?.designation,
      department: user?.department,
      ...profile.toObject(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

// GET /api/employee/predictions
// Returns the last saved predictions for the logged-in employee
const getPredictions = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const predictions = await SkillPrediction.find({ employeeId });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch predictions", error: error.message });
  }
};

// GET /api/employee/recommendations
// Returns recommended courses for the logged-in employee's current skill gaps
const getRecommendations = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const recommendations = await CourseRecommendation.find({ employeeId }).sort({
      priority: -1,
    });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: error.message });
  }
};

// GET /api/employee/history
// Returns every past prediction for the logged-in employee, oldest first,
// so the frontend can chart score trends per skill over time
const getHistory = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const history = await SkillPredictionHistory.find({ employeeId }).sort({
      recordedAt: 1,
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
};

// GET /api/employee/notifications
// Course messages HR has sent to the logged-in employee, newest first
const getNotifications = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const notices = await CourseNotice.find({ employeeId }).sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// PUT /api/employee/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const notice = await CourseNotice.findOneAndUpdate(
      { _id: req.params.id, employeeId }, // employees can only touch their own messages
      { isRead: true },
      { new: true }
    );
    if (!notice) return res.status(404).json({ message: "Notification not found" });
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification", error: error.message });
  }
};

module.exports = { saveProfile, getProfile, getPredictions, getRecommendations, getHistory, getNotifications, markNotificationRead };
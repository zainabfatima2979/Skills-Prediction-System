const axios = require("axios");
const EmployeeProfile = require("../models/EmployeeProfile");
const ManagerReview = require("../models/ManagerReview");
const RequiredSkill = require("../models/RequiredSkill");
const SkillPrediction = require("../models/SkillPrediction");
const SkillPredictionHistory = require("../models/SkillPredictionHistory");
const CourseRecommendation = require("../models/CourseRecommendation");
const User = require("../models/User");
const { getCourseForSkill } = require("./courseCatalog");

const LEVEL_RANK = { Beginner: 1, Intermediate: 2, Advanced: 3 };

// Runs the full prediction flow for one employee:
// 1. Load their profile + required skills for their designation
// 2. For each required skill, find the latest manager rating (if any)
// 3. Call the Python ML service to get a predicted score/level
// 4. Compare against the required level -> OK or Gap
// 5. Save the result in SkillPrediction (overwriting any previous prediction for that skill)
async function runPredictionForEmployee(employeeId) {
  const user = await User.findOne({ employeeId });
  if (!user) throw new Error("Employee not found");

  const profile = await EmployeeProfile.findOne({ employeeId });
  if (!profile) throw new Error("Employee has no profile yet");

  const requiredSkills = await RequiredSkill.find({
    designation: user.designation,
  });
  if (requiredSkills.length === 0) {
    throw new Error(`No required skills configured for designation: ${user.designation}`);
  }

  const hasCertification = profile.certifications?.length > 0 ? 1 : 0;
  const toolsCount = profile.toolsUsed?.length || 0;
  const coursesCompleted = profile.coursesCompleted?.length || 0;

  const results = [];

  for (const req of requiredSkills) {
    // Find the most recent manager rating for this specific skill
    const latestReview = await ManagerReview.findOne({
      employeeId,
      skill: req.skill,
    }).sort({ reviewDate: -1 });

    // No manager review yet for this skill -> don't guess a score, mark it pending
    if (!latestReview) {
      const pending = await SkillPrediction.findOneAndUpdate(
        { employeeId, skill: req.skill },
        {
          employeeId,
          skill: req.skill,
          predictedScore: null,
          predictedLevel: null,
          requiredLevel: req.requiredLevel,
          status: "Review Pending",
          reviewDate: new Date(),
        },
        { new: true, upsert: true }
      );
      await SkillPredictionHistory.create({
        employeeId,
        skill: req.skill,
        predictedScore: null,
        predictedLevel: null,
        requiredLevel: req.requiredLevel,
        status: "Review Pending",
      });
      results.push(pending);
      continue;
    }

    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
      years_experience: profile.yearsExperience,
      manager_rating: latestReview.rating,
      has_certification: hasCertification,
      tools_count: toolsCount,
      courses_completed: coursesCompleted,
    });

    const { predicted_score, predicted_level } = mlResponse.data;

    const status =
      LEVEL_RANK[predicted_level] < LEVEL_RANK[req.requiredLevel] ? "Gap" : "OK";

    const saved = await SkillPrediction.findOneAndUpdate(
      { employeeId, skill: req.skill },
      {
        employeeId,
        skill: req.skill,
        predictedScore: predicted_score,
        predictedLevel: predicted_level,
        requiredLevel: req.requiredLevel,
        status,
        reviewDate: new Date(),
      },
      { new: true, upsert: true }
    );

    await SkillPredictionHistory.create({
      employeeId,
      skill: req.skill,
      predictedScore: predicted_score,
      predictedLevel: predicted_level,
      requiredLevel: req.requiredLevel,
      status,
    });

    results.push(saved);

    if (status === "Gap") {
      const levelGap = LEVEL_RANK[req.requiredLevel] - LEVEL_RANK[predicted_level];

      await CourseRecommendation.findOneAndUpdate(
        { employeeId, skillGap: req.skill },
        {
          employeeId,
          skillGap: req.skill,
          recommendedCourse: await getCourseForSkill(req.skill),
          confidence: Math.min(60 + levelGap * 15, 95), // bigger gap -> higher confidence course is needed
          priority: levelGap,
        },
        { new: true, upsert: true }
      );
    } else {
      // Skill is no longer a gap (e.g. re-predicted after improvement) -> remove any old recommendation
      await CourseRecommendation.deleteOne({ employeeId, skillGap: req.skill });
    }
  }

  return results;
}

module.exports = { runPredictionForEmployee };
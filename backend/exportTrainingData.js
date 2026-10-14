// Exports current data into ml-service/data/training_data.csv so train.py can use it.
// Run this from the backend folder: node exportTrainingData.js
// NOTE: Since there is no independently verified "actual" skill score yet,
// this uses the bootstrap formula's predicted_score as a stand-in label.
// The model will initially learn to mimic the formula - it becomes genuinely
// useful once real outcomes (course completions, follow-up reviews) are logged.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const EmployeeProfile = require("./models/EmployeeProfile");
const ManagerReview = require("./models/ManagerReview");
const SkillPrediction = require("./models/SkillPrediction");

async function exportData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for export");

  const predictions = await SkillPrediction.find({ predictedScore: { $ne: null } });

  if (predictions.length === 0) {
    console.log("No completed predictions found yet. Run /api/employee/predict for at least one employee first.");
    process.exit(0);
  }

  const rows = [];

  for (const pred of predictions) {
    const profile = await EmployeeProfile.findOne({ employeeId: pred.employeeId });
    if (!profile) continue;

    const latestReview = await ManagerReview.findOne({
      employeeId: pred.employeeId,
      skill: pred.skill,
    }).sort({ reviewDate: -1 });
    if (!latestReview) continue;

    rows.push({
      years_experience: profile.yearsExperience,
      manager_rating: latestReview.rating,
      has_certification: profile.certifications?.length > 0 ? 1 : 0,
      tools_count: profile.toolsUsed?.length || 0,
      courses_completed: profile.coursesCompleted?.length || 0,
      actual_score: pred.predictedScore, // stand-in label, see note above
    });
  }

  if (rows.length === 0) {
    console.log("Nothing to export - no matching profile/review/prediction rows found.");
    process.exit(0);
  }

  const header = Object.keys(rows[0]).join(",");
  const csvLines = rows.map((r) => Object.values(r).join(","));
  const csv = [header, ...csvLines].join("\n");

  const outPath = path.join(__dirname, "..", "ml-service", "data", "training_data.csv");
  fs.writeFileSync(outPath, csv);

  console.log(`Exported ${rows.length} rows to ${outPath}`);
  process.exit(0);
}

exportData().catch((err) => {
  console.error("Export failed:", err.message);
  process.exit(1);
});
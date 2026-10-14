const mongoose = require("mongoose");

// Unlike SkillPrediction (which holds only the CURRENT result per employee+skill),
// this collection never overwrites - every prediction run adds a new row here,
// so we can chart how a skill's score changed over time.
const skillPredictionHistorySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    skill: { type: String, required: true },
    predictedScore: { type: Number, default: null },
    predictedLevel: { type: String, default: null },
    requiredLevel: { type: String, required: true },
    status: {
      type: String,
      enum: ["OK", "Gap", "Review Pending"],
      required: true,
    },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillPredictionHistory", skillPredictionHistorySchema);
const mongoose = require("mongoose");

const skillPredictionSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    skill: { type: String, required: true },
    predictedScore: { type: Number, default: null }, // null until manager reviews this skill
    predictedLevel: { type: String, default: null },
    requiredLevel: { type: String, required: true },
    status: {
      type: String,
      enum: ["OK", "Gap", "Review Pending"],
      required: true,
    },
    reviewDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillPrediction", skillPredictionSchema);
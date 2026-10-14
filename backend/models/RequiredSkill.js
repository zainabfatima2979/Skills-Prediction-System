const mongoose = require("mongoose");

const requiredSkillSchema = new mongoose.Schema(
  {
    designation: { type: String, required: true },
    department: { type: String, required: true },
    skill: { type: String, required: true },
    requiredLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RequiredSkill", requiredSkillSchema);

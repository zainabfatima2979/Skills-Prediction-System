const mongoose = require("mongoose");

const employeeProfileSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    yearsExperience: { type: Number, required: true },
    education: { type: String },
    certifications: { type: [String], default: [] },
    toolsUsed: { type: [String], default: [] },
    pastWorkDescription: { type: String },
    coursesCompleted: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmployeeProfile", employeeProfileSchema);

const mongoose = require("mongoose");

// One entry per department that HR asked for people from.
const allocationSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true },
    seats: { type: Number, required: true, min: 1 }, // how many persons HR wants from this department
    status: { type: String, enum: ["Pending", "Submitted"], default: "Pending" },
    selectedEmployeeIds: { type: [String], default: [] },
    submittedBy: { type: String, default: null }, // manager employeeId
    submittedAt: { type: Date, default: null },
  },
  { _id: false }
);

// Created when HR adds a course. It goes to the managers of the chosen
// departments, who pick the employees. Nobody is notified until then.
const courseRequestSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    skill: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    requiredLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
    duration: { type: String, required: true, trim: true }, // e.g. "2 weeks"
    startDate: { type: Date, required: true },
    allocations: { type: [allocationSchema], default: [] },
    createdBy: { type: String, required: true }, // HR employeeId
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseRequest", courseRequestSchema);
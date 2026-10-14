const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, unique: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    department: { type: String, default: null, trim: true }, // null = more than one department
    departments: { type: [String], default: [] }, // every department this course was requested for
    duration: { type: String, default: "", trim: true },
    startDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
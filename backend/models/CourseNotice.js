const mongoose = require("mongoose");

// A message HR sends to an employee saying a course is being arranged for them.
// One row per employee per course.
const courseNoticeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    skill: { type: String, required: true },
    courseName: { type: String, required: true },
    message: { type: String, required: true },
    sentBy: { type: String, default: null }, // HR employeeId
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseNotice", courseNoticeSchema);
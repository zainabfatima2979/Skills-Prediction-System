const mongoose = require("mongoose");

const courseRecommendationSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    skillGap: { type: String, required: true },
    recommendedCourse: { type: String, required: true },
    confidence: { type: Number }, // percentage from ML service
    priority: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "CourseRecommendation",
  courseRecommendationSchema
);

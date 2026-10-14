const mongoose = require("mongoose");

const managerReviewSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    managerId: { type: String, required: true },
    skill: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    overallRemark: { type: String },
    reviewDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagerReview", managerReviewSchema);

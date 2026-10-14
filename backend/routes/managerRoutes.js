const express = require("express");
const router = express.Router();
const {
  submitReview,
  getEmployeeReviews,
  getAllEmployeesForManager,
  getOverview,
  getReviewHistory,
} = require("../controllers/managerController");
const {
  getManagerCourseRequests,
  getCourseRequestCandidates,
  submitCourseSelection,
} = require("../controllers/courseRequestController");
const {
  getCoursesForManager,
  getCourseNeeders,
  sendCourseNotice,
} = require("../controllers/courseNoticeController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/employees", protect, authorizeRoles("manager"), getAllEmployeesForManager);
router.get("/overview", protect, authorizeRoles("manager"), getOverview);
router.get("/history", protect, authorizeRoles("manager"), getReviewHistory);
router.post("/review", protect, authorizeRoles("manager"), submitReview);
router.get("/team/:employeeId", protect, authorizeRoles("manager"), getEmployeeReviews);

router.get("/course-requests", protect, authorizeRoles("manager"), getManagerCourseRequests);
router.get("/course-requests/:id/candidates", protect, authorizeRoles("manager"), getCourseRequestCandidates);
router.post("/course-requests/:id/select", protect, authorizeRoles("manager"), submitCourseSelection);

router.get("/courses", protect, authorizeRoles("manager"), getCoursesForManager);
router.get("/courses/:id/needed-by", protect, authorizeRoles("manager"), getCourseNeeders);
router.post("/courses/:id/notify", protect, authorizeRoles("manager"), sendCourseNotice);

module.exports = router;
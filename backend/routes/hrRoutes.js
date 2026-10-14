const express = require("express");
const router = express.Router();
const {
  getAllEmployees,
  getDashboard,
  getRequiredSkills,
  addRequiredSkill,
  createUser,
  checkEmployeeIdAvailable,
  deactivateUser,
  reactivateUser,
  getDeactivatedEmployees,
  getPredictionsByStatus,
  getUserById,
  updateUser,
  getPredictionStatus,
  getCourses,
  addCourse,
  deleteCourse,
  getAllCourseRecommendations,
  getEmployeeHistory,
  predictForEmployee,
  predictForAll,
  getEmployeeDetail,
  getDepartments,
  getSkillHeatmap,
  getCourseROI,
  getStatusCounts,
} = require("../controllers/hrController");
const { getCourseRequests } = require("../controllers/courseRequestController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/employees", protect, authorizeRoles("hr"), getAllEmployees);
router.get("/dashboard", protect, authorizeRoles("hr"), getDashboard);
router.get("/required-skills", protect, authorizeRoles("hr"), getRequiredSkills);
router.post("/required-skills", protect, authorizeRoles("hr"), addRequiredSkill);
router.post("/create-user", protect, authorizeRoles("hr"), createUser);
router.get("/check-employee-id/:employeeId", protect, authorizeRoles("hr"), checkEmployeeIdAvailable);
router.get("/users/:employeeId", protect, authorizeRoles("hr"), getUserById);
router.put("/users/:employeeId", protect, authorizeRoles("hr"), updateUser);
router.delete("/users/:employeeId", protect, authorizeRoles("hr"), deactivateUser);
router.put("/users/:employeeId/reactivate", protect, authorizeRoles("hr"), reactivateUser);
router.get("/employees/deactivated", protect, authorizeRoles("hr"), getDeactivatedEmployees);
router.get("/predictions", protect, authorizeRoles("hr"), getPredictionsByStatus);
router.get("/prediction-status", protect, authorizeRoles("hr"), getPredictionStatus);
router.get("/courses", protect, authorizeRoles("hr"), getCourses);
router.post("/courses", protect, authorizeRoles("hr"), addCourse);
router.delete("/courses/:id", protect, authorizeRoles("hr"), deleteCourse);
router.get("/course-recommendations", protect, authorizeRoles("hr"), getAllCourseRecommendations);
router.get("/skill-history/:employeeId", protect, authorizeRoles("hr"), getEmployeeHistory);
router.get("/employee-detail/:employeeId", protect, authorizeRoles("hr"), getEmployeeDetail);
router.get("/course-requests", protect, authorizeRoles("hr"), getCourseRequests);
router.get("/departments", protect, authorizeRoles("hr"), getDepartments);
router.get("/skill-heatmap", protect, authorizeRoles("hr"), getSkillHeatmap);
router.get("/course-roi", protect, authorizeRoles("hr"), getCourseROI);
router.get("/status-counts", protect, authorizeRoles("hr"), getStatusCounts);
router.post("/predict-all", protect, authorizeRoles("hr"), predictForAll);
router.post("/predict/:employeeId", protect, authorizeRoles("hr"), predictForEmployee);

module.exports = router;
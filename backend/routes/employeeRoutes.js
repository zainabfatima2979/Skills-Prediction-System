const express = require("express");
const router = express.Router();
const {
  saveProfile,
  getProfile,
  getPredictions,
  getRecommendations,
  getHistory,
  getNotifications,
  markNotificationRead,
} = require("../controllers/employeeController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.post("/profile", protect, authorizeRoles("employee"), saveProfile);
router.get("/profile", protect, authorizeRoles("employee"), getProfile);
router.get("/predictions", protect, authorizeRoles("employee"), getPredictions);
router.get("/recommendations", protect, authorizeRoles("employee"), getRecommendations);
router.get("/history", protect, authorizeRoles("employee"), getHistory);
router.get("/notifications", protect, authorizeRoles("employee"), getNotifications);
router.put("/notifications/:id/read", protect, authorizeRoles("employee"), markNotificationRead);

module.exports = router;
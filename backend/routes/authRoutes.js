const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");

// Registration is no longer public - only HR can create accounts,
// via the protected /api/hr/create-user endpoint.
router.post("/login", login);

module.exports = router;
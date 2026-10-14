// Run this ONCE to create the very first HR account. After this, that HR
// user can log in and create all other accounts (employees, managers, more
// HR) through the app itself via POST /api/hr/create-user.
//
// Usage: node seedFirstHR.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedFirstHR() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: "hr@company.com" });
  if (existing) {
    console.log(`This account already exists: ${existing.email}`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin1234", 10);

  const hrUser = await User.create({
    employeeId: "HR-001",
    name: "Fatima Sheikh",
    email: "hr@company.com",
    password: hashedPassword,
    role: "hr",
    department: "HR",
    designation: "HR Manager",
  });

  console.log("First HR account created:");
  console.log(`  Email: ${hrUser.email}`);
  console.log(`  Password: admin1234`);
  console.log("Log in with these, then use the Create Account page to add everyone else.");

  process.exit(0);
}

seedFirstHR().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
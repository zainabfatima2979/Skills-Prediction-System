// Generates realistic demo employee accounts + profiles across all designations.
// This gives you enough employees to work with, WITHOUT faking the manager
// review or the AI prediction - those still happen through the real system:
// a manager actually rates each employee, then prediction runs for real.
//
// Usage: node seedDemoEmployees.js
// Requires: MongoDB connected (ML service not needed for this step)

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const EmployeeProfile = require("./models/EmployeeProfile");
const RequiredSkill = require("./models/RequiredSkill");

const EMPLOYEES_PER_DESIGNATION = 6; // 6 designations x 6 = ~36 employees

const firstNames = ["Ahmed", "Bilal", "Sara", "Ayesha", "Hamza", "Zara", "Usman", "Fatima", "Ali", "Mariam", "Hassan", "Nida"];
const lastNames = ["Khan", "Raza", "Malik", "Sheikh", "Iqbal", "Farooq", "Chaudhry", "Butt"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const educationOptions = ["BSCS", "BBA", "Intermediate", "DAE", "MBA"];
const toolsPool = ["VS Code", "Git", "Postman", "Excel", "AutoCAD", "SAP", "Slack", "Jira"];
const coursesPool = ["JavaScript Basics", "Excel Fundamentals", "Safety Training 101", "Leadership Basics"];

async function createOneEmployee(designation, department, counter) {
  const employeeId = `${designation.replace(/\s/g, "").toUpperCase().slice(0, 3)}-${100 + counter}`;
  const name = `${randomChoice(firstNames)} ${randomChoice(lastNames)}`;
  const email = `${employeeId.toLowerCase()}@demo.com`;

  const existing = await User.findOne({ employeeId });
  if (existing) return null; // skip if already created in a previous run

  const hashedPassword = await bcrypt.hash("demo1234", 10);

  await User.create({
    employeeId,
    name,
    email,
    password: hashedPassword,
    role: "employee",
    department,
    designation,
  });

  await EmployeeProfile.create({
    employeeId,
    yearsExperience: parseFloat((Math.random() * 5 + 0.3).toFixed(1)),
    education: randomChoice(educationOptions),
    certifications: Math.random() > 0.6 ? ["Relevant Certification"] : [],
    toolsUsed: [randomChoice(toolsPool), randomChoice(toolsPool)],
    pastWorkDescription: "Demo generated profile for testing",
    coursesCompleted: Math.random() > 0.5 ? [randomChoice(coursesPool)] : [],
  });

  return { employeeId, name, email, designation };
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const groups = await RequiredSkill.aggregate([
    { $group: { _id: { designation: "$designation", department: "$department" } } },
  ]);

  if (groups.length === 0) {
    console.log("No required skills found - run seed.js first.");
    process.exit(0);
  }

  const created = [];
  let counter = 1;

  for (const info of groups) {
    const { designation, department } = info._id;
    for (let i = 0; i < EMPLOYEES_PER_DESIGNATION; i++) {
      const result = await createOneEmployee(designation, department, counter);
      if (result) created.push(result);
      counter++;
    }
  }

  console.log(`Created ${created.length} employee accounts + profiles.`);
  console.log("Login for any of them uses password: demo1234");
  console.log("Next: a manager needs to actually submit reviews for each one via /api/manager/review");
  console.log("Then each employee runs /api/employee/predict for a real prediction.");
  console.table(created.map((c) => ({ employeeId: c.employeeId, name: c.name, designation: c.designation })));

  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
// Run this once to seed the Course collection with the mappings that used
// to be hardcoded. After this, HR manages courses from the Manage Courses page.
// Usage: node seedCourses.js

require("dotenv").config();
const mongoose = require("mongoose");
const Course = require("./models/Course");

const courseData = [
  { skill: "React", courseName: "React Advanced Patterns" },
  { skill: "JavaScript", courseName: "JavaScript Deep Dive" },
  { skill: "REST API", courseName: "REST API Development & Security" },
  { skill: "MongoDB", courseName: "MongoDB & Database Design" },
  { skill: "Production Planning", courseName: "Production Planning Fundamentals" },
  { skill: "Quality Control (SOP)", courseName: "Advanced Quality Control & SOP Compliance" },
  { skill: "Safety and EHS", courseName: "Industrial Safety & EHS Essentials" },
  { skill: "Team Supervision", courseName: "Supervisory Skills for Production Teams" },
  { skill: "Machine Operation", courseName: "Machine Operation Essentials" },
  { skill: "MS Excel", courseName: "MS Excel for Reporting" },
  { skill: "Testing and Measurement", courseName: "Testing and Measurement Techniques" },
  { skill: "Documentation", courseName: "Technical Documentation Basics" },
  { skill: "Electrical Maintenance", courseName: "Electrical Maintenance Certification" },
  { skill: "Preventive Maintenance", courseName: "Preventive Maintenance Planning" },
  { skill: "Fault Reporting", courseName: "Fault Reporting and Root Cause Analysis" },
  { skill: "Product Knowledge", courseName: "Product Knowledge Mastery" },
  { skill: "Customer Handling", courseName: "Customer Handling Excellence" },
  { skill: "MS Excel / CRM", courseName: "MS Excel & CRM Essentials" },
  { skill: "Communication", courseName: "Business Communication Skills" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for course seeding");

  for (const item of courseData) {
    await Course.findOneAndUpdate({ skill: item.skill }, item, { upsert: true });
  }

  console.log(`Seeded/updated ${courseData.length} course mappings`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
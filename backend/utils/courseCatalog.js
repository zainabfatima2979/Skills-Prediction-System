// Looks up the recommended course for a skill from the Course collection
// (managed by HR via Manage Courses). Falls back to a generic name if HR
// hasn't added a mapping for that skill yet.
const Course = require("../models/Course");

async function getCourseForSkill(skill) {
  const match = await Course.findOne({ skill });
  return match ? match.courseName : `${skill} Fundamentals`;
}

module.exports = { getCourseForSkill };
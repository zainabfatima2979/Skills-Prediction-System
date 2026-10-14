const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["employee", "manager", "hr"],
      required: true,
    },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    managerId: { type: String }, // link employee to their manager
    isActive: { type: Boolean, default: true }, // false = deactivated, login blocked, data kept
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
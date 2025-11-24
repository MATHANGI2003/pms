import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },

    username: { type: String, required: true },
    name: { type: String },

    email: { type: String, required: true, unique: true },
    position: { type: String },
    salary: { type: Number, default: 0 },

    password: { type: String, required: true },
    role: { type: String, default: "employee" },

    type: {
      type: String,
      enum: ["Internship", "Permanent", "Contract"],
      default: "Permanent",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    joinDate: { type: Date, default: Date.now },
    phone: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", EmployeeSchema);

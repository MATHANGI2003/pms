import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },

    username: { type: String, required: true },
    name: { type: String },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // ✅ Added password field
    position: { type: String },
    salary: { type: Number, default: 0 },


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

    // Additional Profile Fields
    profilePic: { type: String },
    dob: { type: String },
    department: { type: String },
    bankName: { type: String },
    accountNo: { type: String },
    ifsc: { type: String },
    pan: { type: String },
    maritalStatus: { type: String },
    gender: { type: String },
    manager: { type: String },
    location: { type: String },
    skills: { type: [String] },
    certifications: { type: [String] },
    experience: { type: [String] },
    documents: { type: [String] },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", EmployeeSchema);

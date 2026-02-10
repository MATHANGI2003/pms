import mongoose from "mongoose";

const onsiteEmployeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    location: {
      type: String,
      enum: ["USA", "UK", "Germany", "Australia", "Singapore", "Other"],
      default: "Other",
    },
    localTime: String,
    currency: String,
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("OnsiteEmployee", onsiteEmployeeSchema);

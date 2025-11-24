// models/OnsiteEmployee.js
import mongoose from "mongoose";

const onsiteEmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: String,
  location: {
    type: String,
    enum: ["USA", "UK", "Germany", "Australia", "Singapore", "Other"],
    default: "Other",
  },
  localTime: String, // You can compute this in frontend using timezone later
  currency: String,  // e.g. USD, GBP, EUR
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
});

export default mongoose.model("OnsiteEmployee", onsiteEmployeeSchema);

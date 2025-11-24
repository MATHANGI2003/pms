import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    manager: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Department", DepartmentSchema);

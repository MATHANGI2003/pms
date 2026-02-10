// backend/models/Login.js
import mongoose from "mongoose";

const LoginSchema = new mongoose.Schema({
  username: { type: String, required: true },
  role: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Login", LoginSchema);

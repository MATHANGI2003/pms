import express from "express";
import Attendance from "../models/Attendance.js";

const router = express.Router();

// ✅ Save multiple attendance records
router.post("/save-all", async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format" });
    }

    await Attendance.insertMany(records);
    res.status(200).json({ success: true, message: "Attendance saved successfully" });
  } catch (error) {
    console.error("❌ Error saving attendance:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

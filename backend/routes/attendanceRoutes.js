import express from "express";
import EmployeeAttendance from "../models/EmployeeAttendance.js";
// Keeping individual Attendance model import if needed for save-all
import Attendance from "../models/Attendance.js";

const router = express.Router();

// ✅ Clock In
router.post("/clock-in", async (req, res) => {
  try {
    const { employeeName } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-GB"); // HH:mm:ss

    // Check if already clocked in today
    const existing = await EmployeeAttendance.findOne({ username: employeeName, date: today });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already clocked in today" });
    }

    const newRecord = new EmployeeAttendance({
      username: employeeName,
      date: today,
      clockIn: now,
      status: "Present"
    });

    await newRecord.save();
    res.status(200).json({ success: true, message: "Clocked in successfully", record: newRecord });
  } catch (error) {
    console.error("❌ Clock-in error:", error);
    res.status(500).json({ success: false, message: "Server error during clock-in" });
  }
});

// ✅ Clock Out
router.post("/clock-out", async (req, res) => {
  try {
    const { employeeName } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-GB"); // HH:mm:ss

    const record = await EmployeeAttendance.findOne({ username: employeeName, date: today, clockOut: null });
    if (!record) {
      return res.status(400).json({ success: false, message: "No active clock-in found for today" });
    }

    record.clockOut = now;

    // Calculate total hours
    const start = new Date(`${record.date} ${record.clockIn}`);
    const end = new Date(`${record.date} ${now}`);
    const diff = end - start;
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff / 60000) % 60)).padStart(2, "0");
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
    record.totalHours = `${h}:${m}:${s}`;

    await record.save();
    res.status(200).json({ success: true, message: "Clocked out successfully", record });
  } catch (error) {
    console.error("❌ Clock-out error:", error);
    res.status(500).json({ success: false, message: "Server error during clock-out" });
  }
});

// ✅ Get Today's Record
router.get("/today/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const today = new Date().toISOString().split("T")[0];
    const record = await EmployeeAttendance.findOne({ username, date: today });
    res.status(200).json({ success: true, record });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get Attendance History
router.get("/history/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const records = await EmployeeAttendance.find({ username }).sort({ date: -1 });
    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Save multiple attendance records (Admin Functionality)
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

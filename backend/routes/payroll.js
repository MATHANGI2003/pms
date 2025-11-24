import express from "express";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";
//import logActivity from "../utils/logActivity.js";
import saveNotification from "../utils/saveNotification.js";

const router = express.Router();

// ---------------------------------------------------------
// Monthly Payroll Overview
// ---------------------------------------------------------
router.get("/overview", async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const departments = await Employee.distinct("department");
    const totalDepartments = departments.length;

    const payrolls = await Payroll.find();
    const totalPayroll = payrolls.reduce(
      (sum, p) => sum + (p.netSalary || 0),
      0
    );

    res.json({
      totalEmployees,
      totalDepartments,
      totalPayroll,
    });
  } catch (err) {
    console.error("Error fetching payroll overview:", err);
    res.status(500).json({ error: "Server error fetching payroll overview" });
  }
});

// ---------------------------------------------------------
// UPDATE payroll
// ---------------------------------------------------------
router.put("/update/:id", async (req, res) => {
  try {
    const updatedPayroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedPayroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    const io = req.app.get("io");

    logActivity(
      `Payroll updated for ${req.body.employeeName || "Employee"}`,
      io
    );

    res.json({
      message: "Payroll updated successfully",
      payroll: updatedPayroll,
    });
  } catch (err) {
    console.error("Error updating payroll:", err);
    res.status(500).json({ error: "Server error updating payroll" });
  }
});

// ---------------------------------------------------------
// DOWNLOAD Payslip
// ---------------------------------------------------------
router.get("/download/:id", async (req, res) => {
  const empId = req.params.id;

  try {
    // your existing download logic...
    const filePath = "/path/to/generated/file.pdf"; // keep your logic

    const io = req.app.get("io");
    logActivity(`Payslip downloaded for Employee ID: ${empId}`, io);

    res.download(filePath);
  } catch (err) {
    console.error("Download failed:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;

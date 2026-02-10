import express from "express";
import bcrypt from "bcrypt";
import Employee from "../models/Employee.js";

const router = express.Router();

/* ---------------------------------------------
   GENERATE EMPLOYEE ID
----------------------------------------------*/
async function generateEmployeeId() {
  const last = await Employee.findOne().sort({ employeeId: -1 });

  if (!last || !last.employeeId) return "EMP1001";

  const lastNumber = parseInt(last.employeeId.replace("EMP", "")) || 1000;
  return "EMP" + (lastNumber + 1);
}

/* ---------------------------------------------
   GET NEW EMPLOYEE ID
----------------------------------------------*/
router.get("/generate-id", async (req, res) => {
  try {
    res.json({ success: true, employeeId: await generateEmployeeId() });
  } catch {
    res.status(500).json({ success: false, message: "Failed to generate ID" });
  }
});

/* ---------------------------------------------
   GET ALL EMPLOYEES
----------------------------------------------*/
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json({ success: true, employees });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   GET EMPLOYEE BY USERNAME
----------------------------------------------*/
router.get("/username/:username", async (req, res) => {
  try {
    const employee = await Employee.findOne({ username: req.params.username });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
    res.json({ success: true, employee });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   CREATE EMPLOYEE (EDITABLE ID)
----------------------------------------------*/
router.post("/", async (req, res) => {
  try {
    let {
      employeeId,
      username,
      name,
      email,
      position,
      salary,
      password,
      type,
      status,
      joinDate,
      phone,
      address,
    } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email required" });

    const exists = await Employee.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: "Email already exists" });

    // If user left empty → auto generate
    if (!employeeId?.trim()) {
      employeeId = await generateEmployeeId();
    }

    const hashedPassword = await bcrypt.hash(password || "emp123", 10);

    const newEmp = await Employee.create({
      employeeId,
      username: username || name,
      name,
      email,
      position,
      salary,
      password: hashedPassword,
      role: "employee",
      type: type || "Permanent",
      status: status || "Active",
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      phone,
      address,
    });

    const obj = newEmp.toObject();
    delete obj.password;

    res.json({ success: true, employee: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   UPDATE EMPLOYEE (ID EDIT ENABLED)
----------------------------------------------*/
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.joinDate) {
      updateData.joinDate = new Date(updateData.joinDate);
    }

    const updated = await Employee.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Employee not found" });

    const obj = updated.toObject();
    delete obj.password;

    res.json({ success: true, employee: obj });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   DELETE EMPLOYEE
----------------------------------------------*/
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Employee not found" });

    res.json({ success: true, message: "Employee deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/monthly-payroll", async (req, res) => {
  try {
    const employees = await Employee.find();

    let total = 0;

    employees.forEach(emp => {
      if (emp.salary) total += Number(emp.salary);
    });

    res.json({ success: true, monthlyPayroll: total });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

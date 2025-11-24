import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";
import Admin from "./models/Admin.js";
import Employee from "./models/Employee.js";
import Department from "./models/Department.js";
import MonthlyPayroll from "./models/MonthlyPayroll.js";
import OnsiteEmployee from "./models/OnsiteEmployee.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
//import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();
const app = express();
//app.use("/api/activity", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use("/employees", employeeRoutes);
app.use("/api/attendance",attendanceRoutes)

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { dbName: "PayrollManagementSystem" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------------- LOGIN HISTORY SCHEMAS ---------------------- */
const adminLoginSchema = new mongoose.Schema({
  username: String,
  email: String,
  loginTime: { type: Date, default: Date.now },
});
const AdminLogin = mongoose.model("AdminLogin", adminLoginSchema);

const employeeLoginSchema = new mongoose.Schema({
  username: String,
  email: String,
  loginTime: { type: Date, default: Date.now },
});
const EmployeeLogin = mongoose.model("EmployeeLogin", employeeLoginSchema);

/* ----------------------------- RESET TOKENS ----------------------------- */
const resetTokens = new Map();

/* --------------------------- ADMIN SECTION --------------------------- */

// Forgot password (Admin)
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log("📩 Forgot Password Request:", email);

  try {
    let admin = await Admin.findOne({ username: "admin" });

    if (!admin) {
      admin = await Admin.create({
        username: "admin",
        email,
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");
    resetTokens.set(token, { username: "admin", email, role: "admin", createdAt: Date.now() });

    const resetLink = `http://localhost:3000/admin/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - CeiTCS Payroll (Admin)",
      html: `
        <h2>Reset Your Admin Password</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p><small>This link expires in 1 hour.</small></p>
      `,
    });

    res.json({ success: true, message: "Reset link sent to your email." });
  } catch (error) {
    console.error("❌ Error sending reset link:", error);
    res.status(500).json({ success: false, message: "Error sending reset link." });
  }
});

// Reset password (admin + employee)
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const tokenData = resetTokens.get(token);

    if (!tokenData)
      return res.status(400).json({ success: false, message: "Invalid or expired token" });

    const { username, email, role, createdAt } = tokenData;

    if (Date.now() - createdAt > 3600000) {
      resetTokens.delete(token);
      return res.status(400).json({ success: false, message: "Token expired" });
    }

    const hashed = await bcrypt.hash(password, 10);

    if (role === "admin") {
      let admin = await Admin.findOne({ username });
      if (!admin) {
        admin = await Admin.create({ username, email, password: hashed, role: "admin" });
      } else {
        admin.password = hashed;
        if (email) admin.email = email;
        await admin.save();
      }
    } else if (role === "employee") {
      let employee = await Employee.findOne({ email });
      if (!employee) {
        employee = await Employee.create({ username, email, password: hashed, role: "employee" });
      } else {
        employee.password = hashed;
        await employee.save();
      }
    }

    resetTokens.delete(token);
    res.json({ success: true, message: "Password reset successful!" });
  } catch (error) {
    console.error("❌ Error in reset-password route:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin login
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (username !== "admin")
      return res.status(400).json({ success: false, message: "Invalid username" });

    let admin = await Admin.findOne({ username: "admin" });

    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      admin = new Admin({ username: "admin", email: email || "", password: hashed, role: "admin" });
      await admin.save();
      console.log("✅ Default admin created with password admin123");
    }

    const passwordMatches = await bcrypt.compare(password, admin.password);
    const isDefaultPassword = password === "admin123";

    if (!passwordMatches && !isDefaultPassword)
      return res.status(400).json({ success: false, message: "Invalid password" });

    if (email && email !== admin.email) {
      admin.email = email;
      await admin.save();
    }

    const loginRecord = new AdminLogin({ username: admin.username, email: admin.email });
    await loginRecord.save();

    const previousLogins = await AdminLogin.find().sort({ loginTime: -1 }).limit(10).lean();

    res.json({
      success: true,
      message: "Admin login successful",
      redirect: "/admin/dashboard",
      previousLogins,
    });
  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* --------------------------- EMPLOYEE SECTION --------------------------- */

// Forgot password (employee)
app.post("/employee/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log("📩 Employee Forgot Password Request:", email);

  try {
    let employee = await Employee.findOne({ email });
    if (!employee) {
      employee = await Employee.create({
        username: email.split("@")[0],
        email,
        password: await bcrypt.hash("emp123", 10),
        role: "employee",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");
    resetTokens.set(token, {
      username: employee.username,
      email,
      role: "employee",
      createdAt: Date.now(),
    });

    const resetLink = `http://localhost:3000/employee/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request - CeiTCS Payroll (Employee)",
      html: `
        <h2>Reset Your Employee Password</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p><small>This link expires in 1 hour.</small></p>
      `,
    });

    res.json({ success: true, message: "Reset link sent to your email." });
  } catch (error) {
    console.error("❌ Error sending reset link:", error);
    res.status(500).json({ success: false, message: "Error sending reset link." });
  }
});

// ✅ Employee login
app.post("/employee/login", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    let employee = await Employee.findOne({ username });

    if (!employee) {
      const hashed = await bcrypt.hash("emp123", 10);
      employee = new Employee({ username, email, password: hashed, role: "employee" });
      await employee.save();
      console.log("✅ Default employee created with password emp123");
    }

    const passwordMatches = await bcrypt.compare(password, employee.password);
    const isDefaultPassword = password === "emp123";

    if (!passwordMatches && !isDefaultPassword)
      return res.status(400).json({ success: false, message: "Invalid password" });

    const loginRecord = new EmployeeLogin({ username: employee.username, email: employee.email });
    await loginRecord.save();

    const previousLogins = await EmployeeLogin.find().sort({ loginTime: -1 }).limit(10).lean();

    res.json({
      success: true,
      message: "Employee login successful",
      redirect: "/employee-dashboard",
      previousLogins,
    });
  } catch (error) {
    console.error("❌ Employee login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* --------------------------- EMPLOYEE MANAGEMENT --------------------------- */

// Add employee

/* --------------------------- DEPARTMENT MANAGEMENT --------------------------- */

/* --------------------------- DEPARTMENT MANAGEMENT --------------------------- */

/* --------------------------- DEPARTMENT MANAGEMENT --------------------------- */

// ✅ Get all departments
app.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find();
    // Always return an array
    if (!Array.isArray(departments))
      return res.json({ success: true, departments: [] });

    res.json({ success: true, departments });
  } catch (error) {
    console.error("❌ Error fetching departments:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching departments" });
  }
});

// ✅ Add new department
app.post("/departments", async (req, res) => {
  try {
    const { name, manager, description } = req.body;

    if (!name || !manager) {
      return res
        .status(400)
        .json({ success: false, message: "Department name and manager required" });
    }

    // Check if department already exists
    const existingDept = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existingDept) {
      return res
        .status(400)
        .json({ success: false, message: "Department already exists" });
    }

    const newDept = new Department({ name, manager, description });
    await newDept.save();

    // After saving, fetch updated list for live count
    const allDepartments = await Department.find();

    res.status(201).json({
      success: true,
      message: "✅ Department added successfully",
      department: newDept,
      totalDepartments: allDepartments.length, // for live count on frontend
    });
  } catch (error) {
    console.error("❌ Error adding department:", error);
    res.status(500).json({ success: false, message: "Error adding department" });
  }
});

// ✅ Delete department
app.delete("/departments/:id", async (req, res) => {
  try {
    const deleted = await Department.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Department not found" });

    const remainingDepartments = await Department.find();

    res.json({
      success: true,
      message: "✅ Department deleted successfully",
      totalDepartments: remainingDepartments.length, // update count on frontend
    });
  } catch (error) {
    console.error("❌ Error deleting department:", error);
    res.status(500).json({ success: false, message: "Error deleting department" });
  }
});
/* --------------------------- MONTHLY PAYROLL MANAGEMENT --------------------------- */



// Define Monthly Payroll model inline to avoid import issues
const employeeSchema = new mongoose.Schema({
  username: String,
  position: String,
  salary: Number,
  bonus: Number,
  deductions: Number,
  netPay: Number,
});

const summarySchema = new mongoose.Schema({
  totalEmployees: Number,
  totalDepartments: Number,
  totalPayroll: Number,
});

const monthlyPayrollSchema = new mongoose.Schema({
  month: String,
  year: Number,
  employees: [employeeSchema],
  summary: summarySchema,
  createdAt: { type: Date, default: Date.now },
});

//const MonthlyPayroll = mongoose.model("MonthlyPayroll", monthlyPayrollSchema);

// ✅ Save monthly payroll report
app.post("/monthly-payroll/save", async (req, res) => {
  try {
    const { month, year, employees, summary } = req.body;

    if (!employees || employees.length === 0) {
      return res.status(400).json({ success: false, message: "No employees to save" });
    }

    const existing = await MonthlyPayroll.findOne({ month, year });
    if (existing) {
      await MonthlyPayroll.deleteOne({ month, year }); // replace existing report for same month/year
    }

    const newReport = new MonthlyPayroll({ month, year, employees, summary });
    await newReport.save();

    res.status(201).json({ success: true, message: "Monthly payroll saved successfully!" });
  } catch (error) {
    console.error("❌ Error saving payroll:", error);
    res.status(500).json({ success: false, message: "Server error saving payroll" });
  }
});


// ✅ Fetch payroll for the CURRENT month & year
// ⭐ LIVE payroll calculation from employees collection
app.get("/monthly-payroll/live", async (req, res) => {
  try {
    const employees = await Employee.find();

    const totalPayroll = employees.reduce((sum, emp) => {
      return sum + (Number(emp.salary) || 0);
    }, 0);

    res.status(200).json({
      success: true,
      totalPayroll,
    });
  } catch (error) {
    console.error("❌ Error calculating live payroll:", error);
    res.status(500).json({
      success: false,
      message: "Server error calculating payroll",
    });
  }
});



// ✅ Get all onsite employees
app.get("/api/employees/onsite", async (req, res) => {
  try {
    const employees = await OnsiteEmployee.find();
    res.json(employees);
  } catch (error) {
    console.error("❌ Error fetching onsite employees:", error);
    res.status(500).json({ message: "Error fetching onsite employees" });
  }
});

// ✅ Add a new onsite employee
app.post("/api/employees/onsite", async (req, res) => {
  try {
    const { name, role, email, location, localTime, currency, status } = req.body;
    const newEmployee = new OnsiteEmployee({
      name,
      role,
      email,
      location,
      localTime,
      currency,
      status,
    });
    await newEmployee.save();
    res.status(201).json({ message: "✅ Onsite employee added", employee: newEmployee });
  } catch (error) {
    console.error("❌ Error adding onsite employee:", error);
    res.status(500).json({ message: "Error adding onsite employee" });
  }
});

// ✅ Filter onsite employees by country
app.get("/api/employees/onsite/:country", async (req, res) => {
  try {
    const { country } = req.params;
    const employees = await OnsiteEmployee.find({ location: country });
    res.json(employees);
  } catch (error) {
    console.error("❌ Error filtering onsite employees:", error);
    res.status(500).json({ message: "Error filtering onsite employees" });
  }
});

// ✅ Delete onsite employee
// DELETE /api/employees/onsite/:email
app.delete("/api/employees/onsite", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Remove from MongoDB (or whichever DB you use)
    const result = await OnsiteEmployee.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee removed successfully" });
  } catch (err) {
    console.error("Error removing employee:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ Live Payroll Overview API (for Monthly Payroll top counts)
app.get("/api/payroll/overview", async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalDepartments = await Department.countDocuments();

    const employees = await Employee.find();
    const totalPayroll = employees.reduce((sum, e) => {
      const basic = Number(e.salary || 0);
      const bonus = basic * 0.1;
      const deductions = basic * 0.03;
      return sum + (basic + bonus - deductions);
    }, 0);

    res.json({
      success: true,
      totalEmployees,
      totalDepartments,
      totalPayroll,
    });
  } catch (error) {
    console.error("❌ Error fetching live payroll overview:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* --------------------------- SERVER START --------------------------- */
app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
);
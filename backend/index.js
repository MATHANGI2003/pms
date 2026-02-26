import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import Admin from "./models/Admin.js";
import Employee from "./models/Employee.js";
import Department from "./models/Department.js";
import MonthlyPayroll from "./models/MonthlyPayroll.js";
import OnsiteEmployee from "./models/OnsiteEmployee.js";
import Leave from "./models/Leave.js";

import attendanceRoutes from "./routes/attendanceRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
//import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();
const app = express();

/* -------------------- MIDDLEWARE -------------------- */


app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- MULTER CONFIG -------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

app.use("/employees", employeeRoutes);
app.use("/attendance", attendanceRoutes);
//app.use("/api/notifications", notificationRoutes);

/* -------------------- DB CONNECT -------------------- */
mongoose
  .connect(process.env.MONGO_URI, { dbName: "PayrollManagementSystem" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo error:", err));
  

/* -------------------- LOGIN HISTORY -------------------- */
const loginSchema = new mongoose.Schema({
  username: String,
  email: String,
  loginTime: { type: Date, default: Date.now },
});

const AdminLogin = mongoose.model("AdminLogin", loginSchema);
const EmployeeLogin = mongoose.model("EmployeeLogin", loginSchema);
const isValidPassword = (password) => {
  return /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(password);
};


/* -------------------- RESET TOKEN STORE -------------------- */
const resetTokens = new Map();



/* ---------- ADMIN FORGOT PASSWORD ---------- */
app.post("/forgot-password", async (req, res) => {
  try {
    // 🔒 FIXED ADMIN EMAIL
    const ADMIN_EMAIL = "payrollmanagementsystem123@gmail.com";

    let admin = await Admin.findOne({ username: "admin" });

    if (!admin) {
      admin = await Admin.create({
        username: "admin",
        email: ADMIN_EMAIL,
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      });
    }

    // ✅ Always sync admin email to fixed one
    if (admin.email !== ADMIN_EMAIL) {
      admin.email = ADMIN_EMAIL;
      await admin.save();
    }

    const token = crypto.randomBytes(32).toString("hex");

    resetTokens.set(token, {
      role: "admin",
      email: ADMIN_EMAIL,
      createdAt: Date.now(),
    });

    const resetLink = `http://localhost:3000/reset-password/admin/${token}`;

    // 📧 SEND MAIL ONLY TO FIXED ADMIN EMAIL
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"CeiTCS Payroll" <${process.env.EMAIL_USER}>`,
        to: ADMIN_EMAIL, // ✅ FIXED
        subject: "Admin Password Reset - CeiTCS Payroll",
        html: `
          <h3>Admin Password Reset</h3>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
          <p>This link is valid for a short time.</p>
        `,
      });
    }

    console.log("🔑 ADMIN RESET LINK:", resetLink);

    return res.json({
      success: true,
      message: "Reset link sent to admin email",
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


/* ---------- RESET PASSWORD (ADMIN + EMPLOYEE) ---------- */
app.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include a number and a special character",
    });
  }

  const tokenData = resetTokens.get(req.params.token);
  if (!tokenData)
    return res.status(400).json({ success: false, message: "Invalid token" });

  if (Date.now() - tokenData.createdAt > 3600000) {
    resetTokens.delete(req.params.token);
    return res.status(400).json({ success: false, message: "Token expired" });
  }

  const hashed = await bcrypt.hash(password, 10);

  if (tokenData.role === "admin") {
    await Admin.updateOne({ username: "admin" }, { password: hashed });
  } else {
    await Employee.updateOne({ email: tokenData.email }, { password: hashed });
  }

  resetTokens.delete(req.params.token);
  res.json({ success: true, message: "Password reset successful" });
});

// ✅ Employee Reset Password Route (alias)
app.post("/employee/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include a number and a special character",
    });
  }

  const tokenData = resetTokens.get(req.params.token);
  if (!tokenData)
    return res.status(400).json({ success: false, message: "Invalid token" });

  if (Date.now() - tokenData.createdAt > 3600000) {
    resetTokens.delete(req.params.token);
    return res.status(400).json({ success: false, message: "Token expired" });
  }

  if (tokenData.role !== "employee") {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  const hashed = await bcrypt.hash(password, 10);
  await Employee.updateOne({ email: tokenData.email }, { password: hashed });

  resetTokens.delete(req.params.token);
  res.json({ success: true, message: "Password reset successful" });
});


/* ---------- ✅ FIXED ADMIN LOGIN ---------- */

app.post("/admin/login", async (req, res) => {
  try {
    const { password } = req.body;

    // Always fetch single admin
    let admin = await Admin.findOne({ username: "admin" });

    // If admin not exists, create default admin
    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      admin = await Admin.create({
        username: "admin",
        email: "payrollmanagementsystem123@gmail.com",
        password: hashed,
        role: "admin",
      });
    }

    // ✔ Check reset password OR default password
    const passwordMatches = await bcrypt.compare(password, admin.password);
    const isDefaultPassword = password === "admin123";

    if (!passwordMatches && !isDefaultPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Save login history
    await AdminLogin.create({
      username: admin.username,
      email: admin.email,
    });

    res.json({
      success: true,
      message: "Admin login successful",
      redirect: "/admin/dashboard",
    });

  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   ======================= EMPLOYEE ============================
   ============================================================ */

app.post("/employee/login", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Find employee by username OR email
    const employee = await Employee.findOne({
      $or: [{ username: username || email }, { email: email || username }]
    });

    if (!employee)
      return res.status(400).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Invalid password" });

    // Save login history
    await EmployeeLogin.create({
      username: employee.username,
      email: employee.email
    });

    const fullName = employee.name || employee.username;

    res.json({
      success: true,
      message: "Employee login successful",
      role: "employee",
      username: employee.username,
      fullName: fullName,
      redirect: "/employee",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- EMPLOYEE FORGOT PASSWORD ---------- */
app.post("/employee/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(400).json({ success: false, message: "Email not found in records" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    resetTokens.set(token, {
      username: employee.username,
      email,
      role: "employee",
      createdAt: Date.now(),
    });

    const resetLink = `http://localhost:3000/employee/reset-password/${token}`;

    // Try to send email, but don't fail if email config is missing
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false, // Fix for self-signed certificate error
          },
        });

        await transporter.sendMail({
          to: email,
          from: process.env.EMAIL_USER,
          subject: "Employee Password Reset - CeiTCS Payroll",
          html: `<p>Hello ${employee.name || employee.username},</p>
                 <p>Click the link below to reset your password:</p>
                 <a href="${resetLink}">${resetLink}</a>
                 <p>This link expires in 1 hour.</p>`,
        });

        res.json({ success: true, message: "Reset link sent to your email" });
      } else {
        // Email not configured - show link in console for testing
        console.log("📧 Password reset link (email not configured):", resetLink);
        res.json({ success: true, message: "Reset link generated. Check server console." });
      }
    } catch (emailErr) {
      // Email failed but token was created - show in console for testing
      console.log("📧 Email failed. Use this reset link:", resetLink);
      console.error("Email error details:", emailErr.message);
      res.json({ success: true, message: "Reset link generated. Check server console (email sending failed)." });
    }
  } catch (err) {
    console.error("Employee forgot password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Employee Signup Route
app.post("/employee/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
if (!isValidPassword(password)) {
  return res.status(400).json({
    success: false,
    message:
      "Password must be at least 8 characters and include a number and a special character",
  });
}

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if email already exists
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Generate Employee ID
    const last = await Employee.findOne().sort({ employeeId: -1 });
    let employeeId = "EMP1001";
    if (last && last.employeeId) {
      const lastNumber = parseInt(last.employeeId.replace("EMP", "")) || 1000;
      employeeId = "EMP" + (lastNumber + 1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await Employee.create({
      employeeId,
      username: email.split("@")[0], // default username from email
      name: fullName,
      email,
      password: hashedPassword,
      role: "employee",
      type: "Permanent", // ✅ Fixed: must be one of ["Internship", "Permanent", "Contract"]
      status: "Active",
      joinDate: new Date(),
    });

    res.status(201).json({ success: true, message: "Signup successful" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// ✅ Apply for Leave
app.post("/employee/apply-leave", async (req, res) => {
  try {
    const { employeeName, leaveType, fromDate, toDate, reason } = req.body;
    if (!employeeName || !leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newLeave = await Leave.create({
      employeeName,
      leaveType,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: "pending"
    });

    res.status(201).json({ success: true, message: "Leave applied successfully", leave: newLeave });
  } catch (error) {
    console.error("❌ Leave application error:", error);
    res.status(500).json({ success: false, message: "Server error during leave application" });
  }
});

// ✅ Get Employee Leaves
app.get("/employee/leaves/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const leaves = await Leave.find({ employeeName: username }).sort({ appliedOn: -1 });
    res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("❌ Fetch leaves error:", error);
    res.status(500).json({ success: false, message: "Server error fetching leaves" });
  }
});


// ✅ Get Team Leaves (All leaves)
app.get("/employee/leaves/team", async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ appliedOn: -1 });
    res.status(200).json({ success: true, leaves });
  } catch (error) {
    console.error("❌ Fetch team leaves error:", error);
    res.status(500).json({ success: false, message: "Server error fetching team leaves" });
  }
});

/* ----------------------- EMPLOYEE PROFILE ----------------------- */

// ✅ Get Employee Profile
app.get("/employee/profile", async (req, res) => {
  try {
    const { username } = req.headers;
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const employee = await Employee.findOne({ username });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    res.json({ success: true, employee });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
});

// ✅ Update Employee Profile (with Profile Pic)
app.put("/employee/update-profile", upload.single("profileImage"), async (req, res) => {
  try {
    const { username } = req.headers;
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const updateData = { ...req.body };
    if (req.file) {
      updateData.profilePic = req.file.filename;
    }

    const updated = await Employee.findOneAndUpdate({ username }, updateData, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Employee not found" });

    res.json({ success: true, message: "Profile updated successfully", employee: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
});

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

/* -------------------- SERVER -------------------- */
/* -------------------- SERVER -------------------- */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Payroll Management API is running on Vercel",
  });
});
// If running locally → start server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running locally on port ${PORT}`)
  );
}

// If running on Vercel → export app
export default app;
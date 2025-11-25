import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();
const router = express.Router();

/** 📌 Register Admin */

/** 📌 Admin Login */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email });
    if (!admin) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/** 📌 Forgot Password */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({ email });
    if (!admin) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(20).toString("hex");
    admin.resetToken = token;
    admin.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await admin.save();

    const resetLink = `${process.env.FRONTEND_URL}/admin/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"CeiTCS Payroll" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html: `
        <h3>Reset Password Request</h3>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset link sent successfully to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Error sending reset link" });
  }
});

/** 📌 Reset Password */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const admin = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!admin) return res.status(400).json({ message: "Invalid or expired token" });

    const hashed = await bcrypt.hash(password, 10);
    admin.password = hashed;
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
});

export default router;

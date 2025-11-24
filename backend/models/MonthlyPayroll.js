import mongoose from "mongoose";

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

export default mongoose.model("MonthlyPayroll", monthlyPayrollSchema);

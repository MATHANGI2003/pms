import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FiDollarSign, FiDownload, FiInfo, FiTrendingUp } from "react-icons/fi";
import "../../styles/empPayrollPremium.css";

const MonthlyPayroll = () => {
  const [employee, setEmployee] = useState(null);
  const [personalSummary, setPersonalSummary] = useState({
    basicSalary: 0,
    bonus: 0,
    deductions: 0,
    netPay: 0,
  });

  const empUsername = localStorage.getItem("empUsername") || localStorage.getItem("username");

  const fetchPayrollData = async () => {
    try {
      if (!empUsername) {
        Swal.fire("Error", "User details not found. Please log in again.", "error");
        return;
      }

      const res = await axios.get(`http://localhost:5000/employees/username/${empUsername}`);
      if (res.data && res.data.success && res.data.employee) {
        const emp = res.data.employee;
        const basic = Number(emp.salary || 0);
        const bonus = basic * 0.1;
        const deductions = basic * 0.03;
        const netPay = basic + bonus - deductions;

        setEmployee(emp);
        setPersonalSummary({ basicSalary: basic, bonus, deductions, netPay });
      } else {
        Swal.fire("Error", "Employee payroll record not found", "error");
      }
    } catch (err) {
      console.error("Error fetching personal payroll data:", err);
      Swal.fire("Error", "Failed to load individual payroll data", "error");
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const generatePayslipPDF = (emp) => {
    if (!emp) return;
    const basic = Number(emp.salary || 0);
    const bonus = basic * 0.1;
    const deductions = basic * 0.03;
    const netPay = basic + bonus - deductions;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CeiTCS Payroll Management", 14, 20);

    doc.setFontSize(14);
    doc.text("Personal Monthly Payslip", 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 160, 20, { align: "right" });

    doc.setFontSize(12);
    doc.text(`Employee Name: ${emp.fullName || emp.username}`, 14, 45);
    doc.text(`Department: ${emp.department?.toUpperCase() || "GENERAL"}`, 14, 52);
    doc.text(`Designation: ${emp.position?.toUpperCase() || "--"}`, 14, 59);

    doc.autoTable({
      startY: 70,
      head: [["Component", "Amount (INR)"]],
      body: [
        ["Basic Salary", basic.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
        ["Bonus (10%)", bonus.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
        ["Deductions (3%)", deductions.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
        ["Net Payable", netPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ],
      theme: "striped",
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text("Authorized Signature", 14, finalY + 10);
    doc.line(14, finalY + 12, 70, finalY + 12);

    doc.save(`${emp.username}_Payslip_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div className="payroll-premium-container">
      <header className="payroll-header-premium">
        <h2>My Payroll Overview</h2>
        <p>Detailed breakdown of your monthly earnings and deductions</p>
      </header>

      <div className="payroll-stats-grid">
        <div className="payroll-stat-card card-basic">
          <span className="card-label">Basic Salary</span>
          <div className="card-value">₹ {personalSummary.basicSalary.toLocaleString("en-IN")}</div>
        </div>
        <div className="payroll-stat-card card-bonus">
          <span className="card-label">Bonus (10%)</span>
          <div className="card-value">+ ₹ {personalSummary.bonus.toLocaleString("en-IN")}</div>
        </div>
        <div className="payroll-stat-card card-net">
          <span className="card-label">Net Payable</span>
          <div className="card-value">₹ {personalSummary.netPay.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <section className="payroll-table-section">
        <h3><FiDollarSign /> Current Month Breakdown</h3>
        <div className="payroll-table-wrapper">
          <table className="payroll-modern-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employee ? (
                <tr>
                  <td>₹ {personalSummary.basicSalary.toLocaleString("en-IN")}</td>
                  <td>₹ {personalSummary.bonus.toLocaleString("en-IN")}</td>
                  <td>₹ {personalSummary.deductions.toLocaleString("en-IN")}</td>
                  <td style={{ color: '#10b981', fontWeight: 800 }}>₹ {personalSummary.netPay.toLocaleString("en-IN")}</td>
                  <td>
                    <button className="download-btn-premium" onClick={() => generatePayslipPDF(employee)}>
                      <FiDownload /> Payslip
                    </button>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading record...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MonthlyPayroll;

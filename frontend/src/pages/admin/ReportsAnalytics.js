import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../../styles/reportsAnalytics.css";

const ReportsAnalytics = () => {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalPayroll: 0,
    totalCTC: 0,
  });

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/employees");

      if (!res.data || !Array.isArray(res.data.employees)) {
        Swal.fire("Error", "Invalid data format from server", "error");
        return;
      }

      const data = res.data.employees;

      let totalEmployees = data.length;
      let deptNames = data
        .map((e) => (e.position || "").trim().toLowerCase())
        .filter((d) => d && d !== "n/a");
      let uniqueDepartments = new Set(deptNames);

      let totalPayroll = 0;
      let totalCTC = 0;

      const normalized = data.map((e) => {
        const basic = Number(e.salary || 0);

        const hra = Number(e.hra || e.housrent || 0);
        const medical = Number(e.medicalAllowance || e.medical || 0);
        const transport = Number(e.transportAllowance || e.transport || 0);
        const food = Number(e.foodAllowance || e.food || 0);
        const other = Number(e.otherAllowance || e.other || 0);
        const hrAllowance = Number(e.hrAllowance || 0);

        const bonus = +(basic * 0.1).toFixed(2);
        const threePercentDeduction = +(basic * 0.03).toFixed(2);

        const tds = Number(e.tds ?? basic * 0.1);
        const taxExemptions = Number(e.taxExemptions || 0);

        const grossMonthly =
          basic +
          bonus +
          hra +
          medical +
          transport +
          food +
          other +
          hrAllowance;

        const netPay = +(
          grossMonthly -
          tds -
          taxExemptions -
          threePercentDeduction
        ).toFixed(2);

        const ctcYearly = +(netPay * 12).toFixed(2);

        totalPayroll += netPay;
        totalCTC += ctcYearly;

        return {
          ...e,
          basic,
          bonus,
          hra,
          medical,
          transport,
          food,
          other,
          hrAllowance,
          tds,
          taxExemptions,
          threePercentDeduction,
          netPay,
          ctcYearly,
        };
      });

      setEmployees(normalized);

      setSummary({
        totalEmployees,
        totalDepartments: uniqueDepartments.size,
        totalPayroll,
        totalCTC,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
      Swal.fire("Error", "Failed to load analytics", "error");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // UPDATED PDF — ALL FIELDS INCLUDED
  const generatePDF = (emp) => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.addImage("/images/ceitcs-logo.png", "PNG", 140, 13, 28, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("CeiTCS Pvt. Ltd.", 14, 20);

    doc.setFontSize(14);
    doc.text("Employee Payslip", 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(`Employee Name: ${emp.username}`, 14, 45);
    doc.text(
      `Department: ${emp.position ? emp.position.toUpperCase() : "—"}`,
      14,
      52
    );
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 20);

    const tableBody = [
      ["Basic Salary", emp.basic.toLocaleString("en-IN")],
      ["Bonus (10%)", emp.bonus.toLocaleString("en-IN")],
      ["HRA", emp.hra.toLocaleString("en-IN")],
      ["Medical Allowance", emp.medical.toLocaleString("en-IN")],
      ["Transport Allowance", emp.transport.toLocaleString("en-IN")],
      ["Food Allowance", emp.food.toLocaleString("en-IN")],
      ["Other Allowance", emp.other.toLocaleString("en-IN")],
      ["HR Allowance", emp.hrAllowance.toLocaleString("en-IN")],
      ["TDS", emp.tds.toLocaleString("en-IN")],
      ["Tax Exemptions", emp.taxExemptions.toLocaleString("en-IN")],
      ["Deductions (3%)", emp.threePercentDeduction.toLocaleString("en-IN")],
      ["Net Pay (Monthly)", emp.netPay.toLocaleString("en-IN")],
      ["CTC (Yearly)", emp.ctcYearly.toLocaleString("en-IN")],
    ];

    doc.autoTable({
      startY: 65,
      head: [["Component", "Amount (INR)"]],
      body: tableBody,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185], textColor: "#fff" },
      styles: { fontSize: 11 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Authorized Signature", 14, finalY);
    doc.line(14, finalY + 2, 70, finalY + 2);

    doc.save(`${emp.username}_Payslip.pdf`);
  };

  return (
    <div className="reports-container">
      <h2 className="page-title">Payroll Report Analytics</h2>

      <div className="summary-grid">
        <div className="summary-card">
          <h4>Total Employees</h4>
          <p>{summary.totalEmployees}</p>
        </div>

        <div className="summary-card">
          <h4>Total Departments</h4>
          <p>{summary.totalDepartments}</p>
        </div>

        <div className="summary-card">
          <h4>Total Payroll (Net Monthly)</h4>
          <p>₹ {summary.totalPayroll.toLocaleString("en-IN")}</p>
        </div>

        <div className="summary-card">
          <h4>Total CTC (Yearly)</h4>
          <p>₹ {summary.totalCTC.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="table-section">
        <h3>Employee Payroll Details</h3>

        <table className="analytics-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Dept</th>
              <th>Basic (M)</th>
              <th>Bonus</th>
              <th>HRA</th>
              <th>Medical</th>
              <th>Transport</th>
              <th>Food</th>
              <th>Other</th>
              <th>HR Allow</th>
              <th>TDS</th>
              <th>Tax Ex.</th>
              <th>Deductions (3%)</th>
              <th>Net Pay (M)</th>
              <th>CTC (Y)</th>
              <th>PDF</th>
            </tr>
          </thead>

          <tbody>
            {employees.length > 0 ? (
              employees.map((emp, i) => (
                <tr key={i}>
                  <td>{emp.username}</td>
                  <td>{emp.position?.toUpperCase()}</td>
                  <td>₹ {emp.basic.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.bonus.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.hra.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.medical.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.transport.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.food.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.other.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.hrAllowance.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.tds.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.taxExemptions.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.threePercentDeduction.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.netPay.toLocaleString("en-IN")}</td>
                  <td>₹ {emp.ctcYearly.toLocaleString("en-IN")}</td>

                  <td>
                    <button
                      className="pdf-btn"
                      onClick={() => generatePDF(emp)}
                    >
                      ⬇️ PDF
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="16" style={{ textAlign: "center" }}>
                  No employee data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsAnalytics;

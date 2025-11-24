import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "../../styles/reportsAnalytics.css";

const ReportsAnalytics = () => {
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalPayroll: 0,
    totalCTC: 0,
  });
  const [chartData, setChartData] = useState([]);

  // Fetch employees and build analytics
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/employees");

      if (!res.data || !Array.isArray(res.data.employees)) {
        Swal.fire("Error", "Invalid data format from server", "error");
        return;
      }

      const data = res.data.employees;

      const totalEmployees = data.length;
      const deptNames = data
        .map((e) => (e.position || "").trim().toLowerCase())
        .filter((d) => d && d !== "n/a");
      const uniqueDepartments = new Set(deptNames);

      let totalPayroll = 0;
      let totalCTC = 0;
      const deptCounts = {};

      // Normalize and compute payroll for each employee
      const normalized = data.map((e) => {
        // Base values (defaults if missing)
        const basic = Number(e.salary || 0);

        // If employee provides explicit allowances use them; otherwise treat as 0
        const hra = Number(e.hra || e.housrent || 0);
        const medical = Number(e.medicalAllowance || e.medical || 0);
        const transport = Number(e.transportAllowance || e.transport || 0);
        const food = Number(e.foodAllowance || e.food || 0);
        const other = Number(e.otherAllowance || e.other || 0);
       const hrAllowance = Number(e.hrAllowance || 0);

        // TDS if provided in DB otherwise default (10% of basic)
        const tds = Number(e.tds ?? basic * 0.1);

        // Tax exemptions if provided
        const taxExemptions = Number(e.taxExemptions || 0);

        // Bonus (monthly 10% of basic)
        const bonus = Number((basic * 0.1).toFixed(2));

        // grossMonthly: monthly earnings (basic + allowances + bonus)
        const grossMonthly =
          basic + bonus + hra + medical + transport + food + other + hrAllowance;

        // Net Pay = grossMonthly - TDS - taxExemptions
        const netPay = +(grossMonthly - tds - taxExemptions).toFixed(2);

        // CTC yearly = grossMonthly * 12 (PF removed per request)
        const ctcYearly = +(grossMonthly * 12).toFixed(2);

        // accumulate totals
        totalPayroll += Number(netPay || 0);
        totalCTC += Number(ctcYearly || 0);

        const dept = e.position?.toLowerCase() || "unknown";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;

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
          grossMonthly,
          netPay,
          ctcYearly,
        };
      });

      const chartFormatted = Object.keys(deptCounts).map((d) => ({
        department: d.toUpperCase(),
        employees: deptCounts[d],
      }));

      setEmployees(normalized);
      setSummary({
        totalEmployees,
        totalDepartments: uniqueDepartments.size,
        totalPayroll,
        totalCTC,
      });
      setChartData(chartFormatted);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      Swal.fire("Error", "Failed to load analytics", "error");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Generate PDF for a single employee (PF removed)
  const generatePDF = (emp) => {
    const {
      username,
      position,
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
      netPay,
      ctcYearly,
    } = emp;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CeiTCS Pvt. Ltd.", 14, 20);

    doc.setFontSize(14);
    doc.text("Employee Payslip ", 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 180, 20, { align: "right" });

    doc.setFontSize(11);
    doc.text(`Employee Name: ${username || "—"}`, 14, 42);
    doc.text(`Department: ${position ? position.toUpperCase() : "—"}`, 14, 49);

    const tableBody = [
      ["Basic Salary (Monthly)", Number(basic || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Bonus (10%)", Number(bonus || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["HRA", Number(hra || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Medical Allowance", Number(medical || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Transport Allowance", Number(transport || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Food Allowance", Number(food || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Other Allowance", Number(other || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["House Rent Allowance", Number(hrAllowance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["TDS", Number(tds || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Tax Exemptions", Number(taxExemptions || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["Net Pay (Monthly)", Number(netPay || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
      ["CTC (Yearly)", Number(ctcYearly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })],
    ];

    doc.autoTable({
      startY: 62,
      head: [["Component", "Amount (INR)"]],
      body: tableBody,
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], halign: "center" },
      columnStyles: {
        0: { cellWidth: 120, halign: "center" },
        1: { cellWidth: 50, halign: "center" },
      },
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 160;
    doc.setFontSize(11);
    doc.text("Authorized Signature", 14, finalY + 10);
    doc.line(14, finalY + 12, 70, finalY + 12);

    const filename = `${username || "employee"}_Payslip_${new Date().toLocaleDateString()}.pdf`;
    doc.save(filename);
  };
  return (
    <div className="reports-container">
      <h2 className="page-title">Payroll  Report  Analytics</h2>

      {/* Summary Cards */}
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
          <p>₹ {Number(summary.totalPayroll || 0).toLocaleString("en-IN")}</p>
        </div>

        <div className="summary-card">
          <h4>Total CTC (Yearly)</h4>
          <p>₹ {Number(summary.totalCTC || 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Table Section */}
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
              <th>Net Pay (M)</th>
              <th>CTC (Y)</th>
              <th>PDF</th>
            </tr>
          </thead>

          <tbody>
            {employees.length > 0 ? (
              employees.map((emp, idx) => (
                <tr key={idx}>
                  <td>{emp.username}</td>
                  <td>{emp.position ? emp.position.toUpperCase() : "—"}</td>
                  <td>₹ {Number(emp.basic || emp.salary || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.bonus || (emp.salary ? emp.salary * 0.1 : 0)).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.hra || emp.housrent || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.medicalAllowance || emp.medical || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.transportAllowance || emp.transport || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.foodAllowance || emp.food || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.otherAllowance || emp.other || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.hrAllowance || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.tds || (emp.salary ? emp.salary * 0.1 : 0)).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.taxExemptions || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.netPay || 0).toLocaleString("en-IN")}</td>
                  <td>₹ {Number(emp.ctcYearly || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <button className="pdf-btn" onClick={() => generatePDF(emp)}>
                      ⬇️ PDF
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" style={{ textAlign: "center", color: "#999" }}>
                  No employee data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      
    </div>
  );
};

export default ReportsAnalytics;

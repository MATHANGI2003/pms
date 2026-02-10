// src/pages/admin/MonthlyPayroll.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
    BarChart, Bar, XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import "../../styles/MonthlyPayroll.css";
import { NotificationStore } from "../../utils/NotificationStore";

const MonthlyPayroll = () => {
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        totalPayroll: 0,
    });
    const [chartData, setChartData] = useState([]);

    const fetchPayrollData = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");
            if (Array.isArray(res.data.employees)) {
                const data = res.data.employees;
                const totalEmployees = data.length;
                const departments = [...new Set(data.map(e =>
                    e.position?.trim().toLowerCase()
                ))];

                const totalPayroll = data.reduce((s, e) => s + Number(e.salary || 0), 0);

                const deptCounts = {};
                data.forEach((e) => {
                    const dept = e.position?.trim().toLowerCase();
                    if (!dept) return;
                    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                });

                const chartFormatted = Object.keys(deptCounts).map((d) => ({
                    department: d.toUpperCase(),
                    employees: deptCounts[d],
                }));

                setEmployees(data);
                setSummary({
                    totalEmployees,
                    totalDepartments: departments.length,
                    totalPayroll,
                });
                setChartData(chartFormatted);

            } else {
                Swal.fire("Error", "Server returned invalid data", "error");
            }

        } catch (err) {
            Swal.fire("Error", "Unable to load payroll", "error");
        }
    };

    useEffect(() => {
        fetchPayrollData();
        const timer = setInterval(fetchPayrollData, 4000);
        return () => clearInterval(timer);
    }, []);

    const calcNetPay = (salary) => {
        const bonus = salary * 0.1;
        const deductions = salary * 0.03;
        return { bonus, deductions, netPay: salary + bonus - deductions };
    };

    const generatePayslipPDF = (emp) => {
        const salary = Number(emp.salary);
        const { bonus, deductions, netPay } = calcNetPay(salary);

        const doc = new jsPDF();
        // Note: Assuming there is a logo at /images/ceitcs-logo.png or similar. 
        // If it fails on client side, they might need to add the actual file.
        try {
            // doc.addImage("/images/ceitcs-logo.png", "PNG", 140, 9, 28, 36);
        } catch (e) { }

        doc.text("CeiTCS Pvt Ltd.", 15, 15);
        doc.text("Payslip", 15, 25);

        doc.text(`Employee: ${emp.username || emp.name}`, 15, 40);

        doc.autoTable({
            startY: 50,
            head: [["Component", "Amount"]],
            body: [
                ["Basic Salary", salary],
                ["Bonus (10%)", bonus],
                ["Deductions (3%)", deductions],
                ["Net Pay", netPay],
            ],
        });

        doc.save(`${emp.username || emp.name}_Payslip.pdf`);

        NotificationStore.push(`Payslip generated for ${emp.username || emp.name}`);
    };

    const generateAll = async () => {
        if (employees.length === 0)
            return Swal.fire("No Data", "No employees found", "warning");

        Swal.fire("Generating...", "Please wait", "info");

        for (const emp of employees) {
            generatePayslipPDF(emp);
            await new Promise((r) => setTimeout(r, 200));
        }

        NotificationStore.push(`Generated payslips for ${employees.length} employees`);
    };

    return (
        <div className="payroll-container">
            <h2 className="payroll-title">💼 Monthly Payroll Overview</h2>

            <div className="payroll-summary">
                <div className="summary-card"><h4>Total Employees</h4><p>{summary.totalEmployees}</p></div>
                <div className="summary-card"><h4>Total Departments</h4><p>{summary.totalDepartments}</p></div>
                <div className="summary-card"><h4>Total Payroll</h4><p>₹ {summary.totalPayroll.toLocaleString()}</p></div>
            </div>

            <div className="payroll-table-section">
                <h3>Employee Payroll Breakdown</h3>

                <table className="payroll-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Basic</th>
                            <th>Bonus</th>
                            <th>Deduction</th>
                            <th>Net Pay</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {employees.map((emp, i) => {
                            const { bonus, deductions, netPay } = calcNetPay(Number(emp.salary));

                            return (
                                <tr key={i}>
                                    <td>{emp.username || emp.name}</td>
                                    <td>{emp.position?.toUpperCase() || "—"}</td>
                                    <td>{Number(emp.salary).toLocaleString()}</td>
                                    <td>{bonus.toLocaleString()}</td>
                                    <td>{deductions.toLocaleString()}</td>
                                    <td>{netPay.toLocaleString()}</td>

                                    <td>
                                        <button className="download-btn" onClick={() => generatePayslipPDF(emp)}>
                                            ⬇️ Download
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                </table>
            </div>

            <div className="generate-btn-container">
                <button className="generate-btn" onClick={generateAll}>
                    🧾 Generate Monthly Payroll
                </button>
            </div>

            <div className="payroll-chart-section">
                <h3>Department-wise Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="employees" radius={[8, 8, 0, 0]} fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyPayroll;

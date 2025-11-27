import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RoleSelection from "./pages/login/RoleSelection";   // ⭐ NEW FILE ADDED

import AdminLogin from "./pages/login/AdminLogin";
import EmployeeLogin from "./pages/login/EmployeeLogin";

import AdminLayout from "./layouts/AdminLayout";
import EmpLayout from "./layouts/EmpLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import EmpDashboard from "./pages/employee/EmpDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminResetPassword from "./pages/admin/AdminResetPassword";

import EmployeeList from "./pages/admin/EmployeeList";
import Departments from "./pages/admin/Departments";
import MonthlyPayroll from "./pages/admin/MonthlyPayroll";
import OnsiteEmployees from "./pages/admin/OnsiteEmployees";
import AttendancePage from "./pages/admin/AttendancePage";

import ReportsAnalytics from "./pages/admin/ReportsAnalytics";


function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("role");
    setRole(null);
    window.location.href = "/login/admin";
  };

  return (
    <Routes>
      {/* ⭐ Default route is Role Selection page */}
      <Route path="/" element={<RoleSelection />} />

      {/* Login Routes */}
      <Route path="/login/admin" element={<AdminLogin setRole={setRole} />} />
      <Route path="/login/employee" element={<EmployeeLogin setRole={setRole} />} />

      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />

      {/* ADMIN PROTECTED ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role={role} allowedRole="admin">
            <AdminLayout onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="monthly-payroll" element={<MonthlyPayroll />} />
        <Route path="onsite" element={<OnsiteEmployees />} />
        <Route path="reports-analytics" element={<ReportsAnalytics />} />
        
      </Route>

      {/* EMPLOYEE PROTECTED ROUTE */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute role={role} allowedRole="employee">
            <EmpLayout onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmpDashboard />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<h2 style={{ textAlign: "center", marginTop: "50px" }}>404 - Page Not Found</h2>}
      />
    </Routes>
  );
}

export default App;

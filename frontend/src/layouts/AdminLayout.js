import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../styles/sidebar.css";
import {
  FaTachometerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaUserCog,
} from "react-icons/fa";

const AdminLayout = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIXED: supports nested paths
  const getActiveClass = (path) =>
    location.pathname.startsWith(path) ? "active" : "";

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">CeiTCS Admin</h2>

        <nav className="sidebar-nav">
          <ul>
            <li
              className={getActiveClass("/admin/dashboard")}
              onClick={() => navigate("/admin/dashboard")}
            >
              <FaTachometerAlt /> Dashboard
            </li>

            <li
              className={getActiveClass("/admin/employees")}
              onClick={() => navigate("/admin/employees")}
            >
              <FaUsers /> Employees
            </li>

            <li
              className={getActiveClass("/admin/attendance")}
              onClick={() => navigate("/admin/attendance")}
            >
              <FaChartLine /> Attendance
            </li>

            <li
              className={getActiveClass("/admin/monthly-payroll")}
              onClick={() => navigate("/admin/monthly-payroll")}
            >
              <FaMoneyBillWave /> Payroll
            </li>

            <li
              className={getActiveClass("/admin/onsite")}
              onClick={() => navigate("/admin/onsite")}
            >
              <FaBell /> Onsite Employees
            </li>

            <li
              className={getActiveClass("/admin/reports-analytics")}
              onClick={() => navigate("/admin/reports-analytics")}
            >
              <FaUserCog /> Reports
            </li>

          
          </ul>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

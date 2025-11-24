import React from "react";
import { Link } from "react-router-dom";
import "../styles/sidebar.css";

const SidebarEmp = () => {
  return (
    <div className="sidebar">
      <h2>Employee</h2>
      <ul>
        <li><Link to="/employee">Dashboard</Link></li>
        <li><Link to="#">Tasks</Link></li>
        <li><Link to="#">Profile</Link></li>
        <li><Link to="/login/employee">Logout</Link></li>
      </ul>
    </div>
  );
};

export default SidebarEmp;

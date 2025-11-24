import React from "react";
import "../styles/layout.css";

const Navbar = ({ title }) => {
  return (
    <div className="navbar">
      <h3>{title}</h3>
    </div>
  );
};

export default Navbar;

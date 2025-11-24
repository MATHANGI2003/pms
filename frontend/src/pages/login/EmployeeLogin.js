import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/login.css";

const EmployeeLogin = ({ setRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (data.success && data.role === "employee") {
        setRole("employee");
        alert("✅ Employee Login Successful");
        navigate("/employee");
      } else {
        alert("❌ " + (data.message || "Invalid credentials"));
      }
    } catch (err) {
      console.error("Error during login:", err);
      alert("⚠ Server error, please try again.");
    }
  };

  return (
    <div className="login-page employee-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Employee Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="password-container" style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" className="btn-login">
            Login
          </button>
        </form>

        <div className="login-links">
          {/* ✅ Correct route for employee forgot password */}
          <Link to="/forgot-password/employee" className="forgot-link">
            Forgot Password?
          </Link>
        </div>

        <p>
          Are you an admin?{" "}
          <Link to="/login/admin">Login as Admin</Link>
        </p>
      </div>
    </div>
  );
};

export default EmployeeLogin;
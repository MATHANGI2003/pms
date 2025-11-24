import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/login.css";

const AdminLogin = ({ setRole }) => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("role", "admin");
        setRole("admin");

        Swal.fire({
          title: "Success!",
          text: "Stored in MongoDB successfully 🎉",
          icon: "success",
          confirmButtonText: "Continue",
          confirmButtonColor: "#2563eb",
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          navigate("/admin/dashboard");
        });
      } else {
        Swal.fire({
          title: "Login Failed",
          text: data.message,
          icon: "error",
          confirmButtonText: "Retry",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        title: "Server Error",
        text: "⚠️ Please try again later.",
        icon: "error",
      });
    }
  };

  return (
    <div className="login-page admin-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Username"
            required
          />

          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            required
          />

          <button type="submit" className="btn-login">
            Login
          </button>
        </form>

        {message && <p className="error-message">{message}</p>}

        <div className="login-links">
          <Link to="/admin/forgot-password">Forgot Password?</Link><br></br>
          <Link to="/login/employee">Login as Employee</Link><br></br>
          <Link to="/">Back to page</Link>
          <p>Default user: admin</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

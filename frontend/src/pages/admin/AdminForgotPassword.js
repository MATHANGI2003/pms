import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/login.css";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) setMessage("✅ Reset link sent to your email.");
      else setMessage("⚠ Error sending reset link. Please try again.");
    } catch (err) {
      console.error("Error:", err);
      setMessage("⚠ Server error. Try again later.");
    }
  };

  return (
    <div className="login-page admin-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Forgot Password (Admin)</h2>

        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-login">Send Reset Link</button>
        </form>

        {message && <p>{message}</p>}

        <Link to="/login/admin">Back to Login</Link>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
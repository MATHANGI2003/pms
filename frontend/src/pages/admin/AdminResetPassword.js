import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`http://localhost:5000/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      console.log("Response from backend:", data);

      if (data.success) {
        setMessage("✅ Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login/admin"), 2000);
      } else {
        setMessage("❌ " + (data.message || "Failed to reset password."));
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      setMessage("⚠️ Network error. Ensure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page admin-bg">
      <div className="login-box">
        <h2>Reset Password (Admin)</h2>
        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        {message && <p style={{ marginTop: 16 }}>{message}</p>}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FiX, FiPlus, FiCalendar, FiUsers, FiHexagon, FiClock } from "react-icons/fi";
import "../../styles/empLeavePremium.css";

const STATUS_COLORS = {
  pending: "status-pending",
  approved: "status-approved",
  rejected: "status-rejected",
};

const todayStr = () => new Date().toISOString().split("T")[0];
const getDateKey = (d) => new Date(d).toISOString().split("T")[0];

function rangeDates(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  const dates = [];
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split("T")[0]);
  }
  return dates;
}

const EmpLeave = () => {
  const userName = localStorage.getItem("empFullName") || localStorage.getItem("empUsername") || "Employee";
  const userKey = localStorage.getItem("empUsername") || localStorage.getItem("username");

  const [showModal, setShowModal] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("My Requests");
  const [filterStatus, setFilterStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "Casual Leave",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [teamLeaves, setTeamLeaves] = useState([]);

  useEffect(() => {
    fetchLeaves();
    fetchTeamLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/employee/leaves/${encodeURIComponent(userName)}`
      );
      if (res.data && res.data.success && Array.isArray(res.data.leaves)) {
        const normalized = res.data.leaves.map((l) => ({
          ...l,
          leaveType: l.leaveType || "Casual Leave",
          status: (l.status || "Pending").toLowerCase(),
          appliedOn: l.appliedOn ? new Date(l.appliedOn).toISOString() : new Date().toISOString(),
        }));
        setLeaves(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5000/employee/leaves/team");
      if (res.data && res.data.success) {
        setTeamLeaves(res.data.leaves || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, employeeName: userName };
      const res = await axios.post("http://localhost:5000/employee/apply-leave", payload);
      if (res.data && res.data.success) {
        setShowModal(false);
        setFormData({ leaveType: "Casual Leave", fromDate: "", toDate: "", reason: "" });
        fetchLeaves();
        fetchTeamLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const summary = useMemo(() => {
    const types = { "Casual Leave": 12, "Sick Leave": 7, "Earned Leave": 10, "Comp Off": 2 };
    const used = { "Casual Leave": 0, "Sick Leave": 0, "Earned Leave": 0, "Comp Off": 0 };
    leaves.forEach((l) => {
      if (l.leaveType && used[l.leaveType] !== undefined) {
        const days = l.fromDate && l.toDate ? Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000 * 3600 * 24)) + 1 : 1;
        used[l.leaveType] += Math.max(0, days);
      }
    });
    return Object.keys(types).map(t => ({ type: t, used: used[t], total: types[t] }));
  }, [leaves]);

  const filteredLeaves = useMemo(() => {
    let list = leaves.filter(l => {
      if (filterStatus !== "All" && l.status !== filterStatus.toLowerCase()) return false;
      if (query && !l.reason?.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    return list.sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
  }, [leaves, filterStatus, query]);

  return (
    <div className="leave-premium-container">
      <header className="leave-header-premium">
        <div>
          <h2>Leave Management</h2>
          <p>Request and track your time off</p>
        </div>
        <button className="apply-btn-premium" onClick={() => setShowModal(true)}>
          <FiPlus /> Apply for Leave
        </button>
      </header>

      <div className="leave-stats-grid">
        {summary.map((s, i) => (
          <div className="leave-stat-card" key={i}>
            <h4>{s.type}</h4>
            <div className="count">{s.used} <span className="total">/ {s.total} Days</span></div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, (s.used / s.total) * 100)}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="emp-tabs-premium">
        <button className={`emp-tab-btn ${activeTab === "My Requests" ? "active" : ""}`} onClick={() => setActiveTab("My Requests")}>
          <FiClock /> My Requests
        </button>
        <button className={`emp-tab-btn ${activeTab === "Team" ? "active" : ""}`} onClick={() => setActiveTab("Team")}>
          <FiUsers /> Team Status
        </button>
        <button className={`emp-tab-btn ${activeTab === "Holidays" ? "active" : ""}`} onClick={() => setActiveTab("Holidays")}>
          <FiCalendar /> Holidays
        </button>
      </div>

      <div className="leave-table-section">
        {activeTab === "My Requests" && (
          <table className="leave-modern-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((l, i) => (
                <tr key={i}>
                  <td><strong>{l.leaveType}</strong></td>
                  <td>{new Date(l.fromDate).toLocaleDateString()} - {new Date(l.toDate).toLocaleDateString()}</td>
                  <td>{Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / 86400000) + 1}</td>
                  <td><span className={`status-pill status-${l.status}`}>{l.status}</span></td>
                  <td>{l.reason || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "Team" && (
          <table className="leave-modern-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teamLeaves.map((l, i) => (
                <tr key={i}>
                  <td><strong>{l.employeeName}</strong></td>
                  <td>{l.leaveType}</td>
                  <td>{new Date(l.fromDate).toLocaleDateString()} - {new Date(l.toDate).toLocaleDateString()}</td>
                  <td><span className={`status-pill status-${(l.status || 'pending').toLowerCase()}`}>{l.status || 'Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-premium">
            <button className="close-modal" onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', cursor: 'pointer' }}><FiX size={24} /></button>
            <h3>Apply for Leave</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group-premium">
                <label>Leave Type</label>
                <select name="leaveType" value={formData.leaveType} onChange={handleChange}>
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Comp Off</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group-premium">
                  <label>From Date</label>
                  <input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} required />
                </div>
                <div className="form-group-premium">
                  <label>To Date</label>
                  <input type="date" name="toDate" value={formData.toDate} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-group-premium">
                <label>Reason</label>
                <textarea name="reason" value={formData.reason} onChange={handleChange} rows="4" placeholder="Briefly explain your reason..." required></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpLeave;

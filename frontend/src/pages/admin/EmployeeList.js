// src/pages/admin/EmployeeList.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../../styles/EmployeeList.css";
import { NotificationStore } from "../../utils/NotificationStore";

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [popupMsg, setPopupMsg] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    const [form, setForm] = useState({
        employeeId: "",
        username: "",
        name: "",
        email: "",
        position: "",
        salary: "",
        type: "Permanent",
        status: "Active",
        joinDate: "",
        phone: "",
        address: "",
    });

    const triggerPopup = (msg) => {
        setPopupMsg(msg);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
    };

    // ------------------ SUBSCRIBE NOTIFICATION ------------------
    useEffect(() => {
        const unsubscribe = NotificationStore.subscribe((list) => {
            if (list?.length) triggerPopup(list[0].message);
        });
        return () => unsubscribe();
    }, []);

    // ------------------ FETCH EMPLOYEES ------------------
    const fetchEmployees = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");
            setEmployees(res.data.employees || []);
        } catch {
            Swal.fire("Error", "Failed to load employees", "error");
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // ------------------ RESET FORM ------------------
    const resetForm = () =>
        setForm({
            employeeId: "",
            username: "",
            name: "",
            email: "",
            position: "",
            salary: "",
            type: "Permanent",
            status: "Active",
            joinDate: "",
            phone: "",
            address: "",
        });

    // ------------------ SUBMIT FORM ------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.username && !form.name)
            return Swal.fire("Validation", "Enter Name/Username", "warning");

        if (!form.email)
            return Swal.fire("Validation", "Enter Email", "warning");

        try {
            if (editing) {
                await axios.put(
                    `http://localhost:5000/employees/${editing._id}`,
                    form
                );
                NotificationStore.push(`Employee "${form.username}" updated`);
            } else {
                await axios.post("http://localhost:5000/employees", form);
                NotificationStore.push(`Employee "${form.username}" added`);
            }

            resetForm();
            setFormOpen(false);
            setEditing(null);
            fetchEmployees();
        } catch (err) {
            const msg = err.response?.data?.message || "Unable to save employee";
            Swal.fire("Error", msg, "error");
        }
    };

    // ------------------ DELETE EMPLOYEE ------------------
    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: "Delete employee?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`http://localhost:5000/employees/${id}`);
            NotificationStore.push("Employee deleted");
            fetchEmployees();
        } catch {
            Swal.fire("Error", "Unable to delete", "error");
        }
    };

    return (
        <div className="employee-list-container">
            {/* POPUP */}
            {showPopup && <div className="mini-popup">{popupMsg}</div>}

            {/* HEADER */}
            <div className="header-row">
                <h2>Employee Management</h2>

              {/*  <button
                    className="add-employee-btn"
                    onClick={async () => {
                        resetForm();
                        setEditing(null);

                        try {
                            const res = await axios.get(
                                "http://localhost:5000/employees/generate-id"
                            );

                            setForm((prev) => ({
                                ...prev,
                                employeeId: res.data.employeeId,
                            }));
                        } catch {
                            Swal.fire("Error", "Unable to generate Employee ID", "error");
                        }

                        setFormOpen(true);
                    }}
                >
                    ➕ Add Employee
                </button>*/}
            </div>

            {/* MODAL FORM */}
            {formOpen && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h3>{editing ? "Edit Employee" : "Add Employee"}</h3>

                        <form className="employee-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <input
                                    type="text"
                                    placeholder="Employee ID"
                                    value={form.employeeId}
                                    onChange={(e) =>
                                        setForm({ ...form, employeeId: e.target.value })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    required
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({ ...form, username: e.target.value })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    required
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Position"
                                    value={form.position}
                                    onChange={(e) =>
                                        setForm({ ...form, position: e.target.value })
                                    }
                                />
                                <input
                                    type="number"
                                    placeholder="Salary"
                                    value={form.salary}
                                    onChange={(e) =>
                                        setForm({ ...form, salary: e.target.value })
                                    }
                                />
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({ ...form, type: e.target.value })
                                    }
                                >
                                    <option>Permanent</option>
                                    <option>Contract</option>
                                    <option>Internship</option>
                                </select>
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm({ ...form, status: e.target.value })
                                    }
                                >
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>
                                <input
                                    type="date"
                                    value={form.joinDate}
                                    onChange={(e) =>
                                        setForm({ ...form, joinDate: e.target.value })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Phone"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({ ...form, phone: e.target.value })
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm({ ...form, address: e.target.value })
                                    }
                                />
                            </div>

                            <button className="submit-btn" type="submit">
                                {editing ? "Update Employee" : "Add Employee"}
                            </button>
                        </form>

                        <button className="close-modal" onClick={() => setFormOpen(false)}>
                            ✖ Close
                        </button>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="table-wrapper">
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th>Emp ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Position</th>
                            <th>Salary</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Join Date</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {employees.length ? (
                            employees.map((emp) => (
                                <tr key={emp._id}>
                                    <td>{emp.employeeId || "—"}</td>
                                    <td>{emp.username}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.position || "—"}</td>
                                    <td>{emp.salary || "—"}</td>
                                    <td>{emp.type}</td>
                                    <td>{emp.status}</td>
                                    <td>
                                        {emp.joinDate
                                            ? new Date(emp.joinDate).toLocaleDateString()
                                            : "—"}
                                    </td>
                                    <td>{emp.phone || "—"}</td>
                                    <td className="address-col">{emp.address || "—"}</td>
                                    <td>
                                        <button
                                            className="edit-btn"
                                            onClick={() => {
                                                setEditing(emp);
                                                setForm({
                                                    employeeId: emp.employeeId || "",
                                                    username: emp.username || "",
                                                    name: emp.name || "",
                                                    email: emp.email || "",
                                                    position: emp.position || "",
                                                    salary: emp.salary || "",
                                                    type: emp.type || "Permanent",
                                                    status: emp.status || "Active",
                                                    joinDate: emp.joinDate
                                                        ? emp.joinDate.split("T")[0]
                                                        : "",
                                                    phone: emp.phone || "",
                                                    address: emp.address || "",
                                                });
                                                setFormOpen(true);
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(emp._id)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11">No employees</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeList;

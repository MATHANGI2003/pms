import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/onsiteEmployees.css";
import Swal from "sweetalert2";
import { ComposableMap, Geographies, Geography } from "react-simple-maps"; // 🌍 Map components

// ✅ Use a reliable topojson source
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const OnsiteEmployees = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [onsiteEmployees, setOnsiteEmployees] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [loading, setLoading] = useState(false);

  const countries = ["All", "USA", "UK", "Germany", "Australia", "Singapore"];

  // 🔹 Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, onsiteRes] = await Promise.all([
          axios.get("http://localhost:5000/employees"),
          axios.get("http://localhost:5000/api/employees/onsite"),
        ]);
        setAllEmployees(empRes.data.employees || []);
        setOnsiteEmployees(onsiteRes.data || []);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchData();
  }, []);

  // 🔹 Currency mapping helper
  const getCurrency = (country) => {
    const map = {
      USA: "USD ($)",
      UK: "GBP (£)",
      Germany: "EUR (€)",
      Australia: "AUD (A$)",
      Singapore: "SGD (S$)",
    };
    return map[country] || "INR (₹)";
  };

  // 🔹 Assign employee instantly + sync backend
  const assignCountry = async (empId, country) => {
    try {
      const emp = allEmployees.find((e) => e._id === empId);
      if (!emp) return;

      const payload = {
        name: emp.username,
        role: emp.position,
        email: emp.email,
        location: country,
        localTime: new Date().toLocaleTimeString(),
        currency: getCurrency(country),
        status: "Active",
      };

      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/employees/onsite",
        payload
      );

      if (response.status === 201 || response.status === 200) {
        setOnsiteEmployees((prev) => [...prev, response.data.employee || payload]);
        Swal.fire({
          icon: "success",
          title: "Assigned!",
          text: `${emp.username} has been assigned to ${country}.`,
          confirmButtonColor: "#4634eb",
        });
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      Swal.fire("❌ Error", "Failed to assign employee", "error");
      console.error("Error assigning employee:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Remove employee from onsite list
  const removeEmployee = async (email) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will remove the employee from the onsite list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e63946",
      cancelButtonColor: "#6c757d",
      background: "#fff",
      color: "#333",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete("http://localhost:5000/api/employees/onsite", {
        data: { email },
      });

      setOnsiteEmployees((prev) => prev.filter((emp) => emp.email !== email));

      Swal.fire({
        icon: "success",
        title: "Removed!",
        text: "Employee removed successfully.",
        confirmButtonColor: "#4634eb",
      });
    } catch (error) {
      Swal.fire("❌ Error", "Failed to remove employee", "error");
      console.error(error);
    }
  };

  // 🔹 Filter by selected country
  const filteredEmployees =
    selectedCountry === "All"
      ? onsiteEmployees
      : onsiteEmployees.filter(
          (emp) =>
            emp.location?.toLowerCase() === selectedCountry.toLowerCase()
        );

  // 🔹 Count helper
  const getCount = (country) =>
    country === "All"
      ? onsiteEmployees.length
      : onsiteEmployees.filter(
          (e) => e.location?.toLowerCase() === country.toLowerCase()
        ).length;

  // 🔹 Define colors for map highlighting
  const countryColors = {
    USA: "#4caf50",
    UK: "#2196f3",
    Germany: "#ff9800",
    Australia: "#9c27b0",
    Singapore: "#f44336",
  };

  return (
    <div className="onsite-container">
      <h2 className="onsite-title">🌍 Onsite Employees</h2>
      <p className="onsite-subtitle">
        Manage employees working from international locations
      </p>

      <div className="onsite-top">
        {/* Left: Country Distribution */}
        <div className="country-section">
          <h3>Distribution by Country</h3>
          {countries.map((country) => (
            <button
              key={country}
              className={`country-btn ${
                selectedCountry === country ? "active" : ""
              }`}
              onClick={() => setSelectedCountry(country)}
            >
              {country}
              <span className="count">{getCount(country)}</span>
            </button>
          ))}
        </div>

        {/* ✅ Right: Colorful Interactive World Map */}
       {/* ✅ Right: Dynamic Colorful Interactive World Map */}
<div className="map-section">
  <h3>Global Distribution</h3>
  <div className="map-container">
    <ComposableMap projectionConfig={{ scale: 140 }} width={800} height={400}>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const name = geo.properties.name;

            // 🌍 Map actual country names in GeoJSON to your keys
            const countryNameMap = {
              "United States of America": "USA",
              "United Kingdom": "UK",
              Germany: "Germany",
              Australia: "Australia",
              Singapore: "Singapore",
            };

            const mapped = countryNameMap[name];

            // 🔹 Check if employees exist in that country
            const hasEmployees =
              mapped &&
              onsiteEmployees.some(
                (emp) => emp.location?.toLowerCase() === mapped.toLowerCase()
              );

            // 🔹 Define colors (only color if employees exist)
            const countryColors = {
              USA: "#4caf50",
              UK: "#2196f3",
              Germany: "#ff9800",
              Australia: "#9c27b0",
              Singapore: "#f44336",
            };

            const fillColor = hasEmployees
              ? countryColors[mapped] || "#ccc"
              : "#e0e0e0";

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fillColor}
                stroke="#fff"
                strokeWidth={0.5}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  </div>
</div>
</div>

      {/* Table */}
      <div className="onsite-table-container">
        <table className="onsite-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Location</th>
              <th>Role</th>
              <th>Email</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp, i) => (
                <tr key={i}>
                  <td>{emp.name}</td>
                  <td>{emp.location}</td>
                  <td>{emp.role}</td>
                  <td>{emp.email}</td>
                  <td>{emp.currency}</td>
                  <td>
                    <span className="status-badge active">{emp.status}</span>
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => removeEmployee(emp.email)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No employees found for {selectedCountry}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Section */}
      <div className="assign-section">
        <h3>Assign Employee to Country</h3>
        <div className="assign-form">
          <select id="employeeSelect">
            {allEmployees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.username}
              </option>
            ))}
          </select>
          <select id="countrySelect">
            {countries
              .filter((c) => c !== "All")
              .map((c) => (
                <option key={c}>{c}</option>
              ))}
          </select>
          <button
            disabled={loading}
            onClick={() =>
              assignCountry(
                document.getElementById("employeeSelect").value,
                document.getElementById("countrySelect").value
              )
            }
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnsiteEmployees;

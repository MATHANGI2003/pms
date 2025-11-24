import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/settings.css"; // make sure to create CSS below

export default function Settings() {
  const [notifications, setNotifications] = useState([]);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notifications");

      const data = res.data.notifications || res.data; // support both formats

      // Check for new notification
      if (data.length > notifications.length) {
        const latest = data[0];
        showPopup(latest.action || "New activity");
      }

      setNotifications(data);
    } catch (err) {
      console.log("Error fetching notifications", err);
    }
  };

  const showPopup = (message) => {
    setPopup(message);
    setTimeout(() => setPopup(null), 3000); // auto-hide after 3 sec
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p>Popups will appear here whenever actions happen.</p>

      {popup && (
        <div className="popup">
          <span>{popup}</span>
        </div>
      )}
    </div>
  );
}

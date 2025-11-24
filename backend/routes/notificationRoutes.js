import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const notifications = await Notification
    .find()
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(notifications);
});

export default router;

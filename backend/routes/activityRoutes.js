import express from "express";
import Activity from "../models/Activity.js";

const router = express.Router();

router.get("/recent", async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

export default router;

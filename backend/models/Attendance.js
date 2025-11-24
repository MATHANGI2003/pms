import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Leave"],
    required: true,
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;

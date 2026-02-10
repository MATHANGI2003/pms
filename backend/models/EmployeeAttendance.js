import mongoose from "mongoose";

const employeeAttendanceSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    clockIn: {
        type: String, // HH:mm:ss
        required: true
    },
    clockOut: {
        type: String, // HH:mm:ss
        default: null
    },
    totalHours: {
        type: String, // HH:mm:ss
        default: "00:00:00"
    },
    status: {
        type: String,
        enum: ["Present", "Late", "Absent"],
        default: "Present"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure uniqueness per user per day
employeeAttendanceSchema.index({ username: 1, date: 1 }, { unique: true });

const EmployeeAttendance = mongoose.model("EmployeeAttendance", employeeAttendanceSchema);
export default EmployeeAttendance;

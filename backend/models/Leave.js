import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
    employeeName: {
        type: String,
        required: true,
        index: true
    },
    leaveType: {
        type: String,
        required: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    appliedOn: {
        type: Date,
        default: Date.now
    }
});

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;

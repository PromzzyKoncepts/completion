const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    name: String,
    description: String,
    startTime: Date,
    endTime: Date,
    sessionType: {
        type: String,
        enum: ["session", "listening_ear"],
    },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionCategories: [
        { type: mongoose.Schema.Types.ObjectId, ref: "SessionCategory" },
    ],
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "confirmed", "approved"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: {
        type: Date,
    },
    sessionNotes: {
        title: "",
        content: "",
    },
    sessionHeld: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Session", sessionSchema);

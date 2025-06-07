const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const moodLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: false
    },
    date: {
        type: Date,
        default: Date.now,
        unique: false
    },
    category: {
        type: String,
        enum: ["Bad", "Not Great", "Neutral", "Good", "Great"],
        required: true
    },
    emotion: {
        type: [String],
        required: true
    },
    note: {
        type: String,
        required: true
    }
});

module.exports = mongooseV2.model("MoodLog", moodLogSchema);

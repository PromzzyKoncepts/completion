const mongoose = require("mongoose");
const {mongooseV2} = require("../../configs/database/db");

const moodCategorySchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ["Bad", "Not Great", "Neutral", "Good", "Great"],
        required: true,
        unique: true
    },
    emotions: [
        {
            type: String,
            required: true
        }
    ]
});

module.exports = mongooseV2.model("MoodCategory", moodCategorySchema);

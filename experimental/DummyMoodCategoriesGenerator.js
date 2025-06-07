const mongoose = require("mongoose");
const { mongooseV2 } = require("../src/configs/database/db");
const MoodCategory = require("../src/models/v2/MoodCategory");  // Adjust the path to your model
const AppLogger = require("../src/middlewares/logger/logger")

exports.insertDummyRecords = async () => {
    const moodCategories = [
        {
            category: "Bad",
            emotions: ["Sad", "Overwhelmed"]
        },
        {
            category: "Not Great",
            emotions: ["Stressed", "Tired"]
        },
        {
            category: "Neutral",
            emotions: ["Indifferent", "Calm"]
        },
        {
            category: "Good",
            emotions: ["Happy", "Content"]
        },
        {
            category: "Great",
            emotions: ["Excited", "Motivated"]
        }
    ];

    try {
        await MoodCategory.insertMany(moodCategories);
    } catch (error) {
        AppLogger.error(error);
    } finally {
        mongooseV2.connection.close();
    }
};



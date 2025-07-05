const mongoose = require("mongoose"); // Import mongoose

// Ensure you have the correct instance of mongoose
const { mongooseV2 } = require("../../configs/database/db");

// Define the Schema using mongoose.Schema
const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the User model
        ref: "Users",                         // Ensure there is a User model
        required: true
    },
    comment: {
        type: String,
        required: true,
        trim: true, // Removes leading and trailing whitespace
        minlength: 10, // Minimum length of the comment
        maxlength: 500 // Maximum length of the comment
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Minimum rating value
        max: 5  // Maximum rating value
    },
    userRated: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the User model
        ref: "Counsellor",                    // Ensure there is a Counsellor model
        required: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Export the model using mongooseV2 instance
module.exports = mongooseV2.model("Feedback", feedbackSchema);

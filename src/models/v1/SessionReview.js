const mongoose = require("mongoose");

const reviewsSchema = new mongoose.Schema({
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
    rating: { type: Number },
    feedBackNote: { type: String },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedOn: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("SessionReview", reviewsSchema);

const mongoose = require("mongoose");
const {mongooseV2} = require("../../configs/database/db");

const thoughtSchema = new mongoose.Schema({
    text: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    viewCount: { type: Number, default: 0 }, // Keeps track of the number of views
    shares: [{
        platform: { type: String }, // e.g., 'Facebook', 'Twitter'
        count: { type: Number },
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true // Automatically manage createdAt and updatedAt timestamps
});

const ThoughtOfTheDay = mongooseV2.model("ThoughtOfTheDay", thoughtSchema);

module.exports = ThoughtOfTheDay;

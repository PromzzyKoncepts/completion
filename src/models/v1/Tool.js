const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    responseDate: {
        type: Date,
        default: Date.now,
    },
    response: {
        name: String,
        description: String,
        toolCode: String,
        campletedAll: { type: Boolean },
        data: [
            {
                code: String,
                name: String,
                answer: [String],
                notes: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
                startTime: {
                    type: Date,
                },
                endTime: {
                    type: Date,
                },
                duration: Number,
            },
        ],
    },
});

module.exports = mongoose.model("Tool", toolSchema);

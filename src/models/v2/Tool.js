/**
 * ⚠️ Work in Progress ⚠️
 *
 * This section of code has been initially replicated from version 1 (v1) of the application.
 * It serves as a placeholder to maintain code structure and style for future development.
 *
 * Developers, please note:
 * - This code is not yet complete and may require updates to meet new requirements.
 * - Feel free to modify and extend it as needed, following the established coding standards.
 *
 * If you're building upon this code, consider:
 * - Removing unused sections and variables.
 * - Adding new functionality or adapting existing logic.
 * - Ensuring compatibility with the latest libraries or technologies.
 *
 * Your contributions are vital to bringing this code to life! 🚀
 */

const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

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

module.exports = mongooseV2.model("Tool", toolSchema);

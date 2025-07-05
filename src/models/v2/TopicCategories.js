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

const topicCategorySchema = new mongoose.Schema({
    name: String,
    description: String,
    code: String,
    color_code: String,
    created_on: String,
    topic_count: Number,
    created_by: String,
    rank: Number,
});

module.exports = mongooseV2.model(
    "TopicCategory",
    topicCategorySchema,
    "topic-categories"
);

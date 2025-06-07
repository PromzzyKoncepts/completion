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

const toolCategoriesSchema = new mongoose.Schema({
    name: String,
    code: String,
    icon: String,
    color: String,
    subcategories: [
        {
            name: String,
            icon: String,
            duration: Number,
            code: String,
            options: [String],
        },
    ],
    rank: Number,
});

module.exports = mongooseV2.model(
    "ToolCategory",
    toolCategoriesSchema,
    "tool-categories"
);

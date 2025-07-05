const mongoose = require("mongoose");

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

module.exports = mongoose.model(
    "ToolCategory",
    toolCategoriesSchema,
    "tool-categories"
);

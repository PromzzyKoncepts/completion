const mongoose = require("mongoose");

const sessionCategorySchema = new mongoose.Schema({
    name: String,
    description: String,
    code: String,
    color_code: String,
    created_on: String,
    created_by_id: String,
});

module.exports = mongoose.model(
    "SessionCategory",
    sessionCategorySchema,
    "session-categories"
);

const mongoose = require("mongoose");

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

module.exports = mongoose.model(
    "TopicCategory",
    topicCategorySchema,
    "topic-categories"
);

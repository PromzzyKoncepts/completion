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
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
const Comment = require("./Comment");
const { mongooseV2 } = require("../../configs/database/db");

const tipSchema = new mongoose.Schema(
    {
        icon: {
            url: { type: String, required: true },
            reference: { type: String, required: true },
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
    },
    { _id: true }
);

const topicSchema = mongoose.Schema({
    title: String,
    description: String,
    image: {
        url: { type: String },
        reference: { type: String },
    },
    tipsAndGuidelines: [tipSchema],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    commentCount: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
    muted: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        default: [],
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
});

topicSchema.virtual("comments").get(async () => {
    const comments = await Comment.find({ topic: this._id });
    return comments;
});

topicSchema.plugin(mongooseLeanVirtuals);

module.exports = mongooseV2.model("Topic", topicSchema);

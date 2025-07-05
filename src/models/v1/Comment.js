const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    content: {
        type: String,
    },
    commentAuthor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    likeCount: { type: Number },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [
        {
            content: { type: String },
            commentAuthor: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            likeCount: { type: Number },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            createdAt: { type: Date, default: Date.now },
            lastUpdated: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model("Comment", commentSchema);

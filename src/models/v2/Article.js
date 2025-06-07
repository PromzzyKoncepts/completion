const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const ArticleSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    coverImage: {
        type: String,
    },
    tag: {
        type: String,
    },
    content: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    publishedAt: {
        type: Date,
        default: Date.now,
    },
    edited: {
        type: Boolean,
        default: false,
    },
    lastEditedAt: {
        type: Date,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    likeCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    commentCount: {
        type: Number,
        default: 0,
        min: 0,
    },
});

/**
 * Populate the "author" field with specific user information when using the "find" method.
 *
 * @param {Function} next - The next function to call in the middleware chain.
 */
ArticleSchema.pre("find", function (next) {
    this.populate("author", "_id firstName lastName username");
    next();
});

/**
 * Cascade delete related comments when an article is deleted.
 *
 * @param {Function} next - The next function to call in the middleware chain.
 */
ArticleSchema.post(
    "deleteOne",
    { document: true, query: false },
    async function (next) {
        const article = this;
        await article.model("Comment").deleteMany({ article: article._id });
        next();
    }
);

module.exports = mongooseV2.model("Article", ArticleSchema);

const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const commentSchema = new mongoose.Schema(
    {
        // topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Article",
        },
        content: {
            type: String,
        },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        likeCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        edited: { type: Boolean, default: false },
        lastEditedAt: { type: Date, default: Date.now },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
        replies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
        repliesCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Populate author, likes, and replies when using find()
 */
commentSchema.pre("find", function (next) {
    this.populate({
        path: "author",
        select: "username",
    })
        .populate({
            path: "likes",
            select: "username",
        })
        .populate({
            path: "replies",
            options: {
                limit: 5,
                sort: "-likeCount",
            },
        });
    next();
});

/**
 * Delete comments and their replies when multiple comments are deleted.
 *
 * @param {Function} next - The next function to call in the middleware chain.
 */
commentSchema.post("deleteMany", async function (next) {
    const comments = this;

    const commentIds = comments.map((comment) => comment._id);

    // Delete the replies of the comments being deleted
    await this.model("Comment").deleteMany({
        parentComment: { $in: commentIds },
    });

    // Update repliesCount for parent comments
    await this.model("Comment").updateMany(
        { _id: { $in: comments.map((comment) => comment.parentComment) } },
        { $inc: { repliesCount: -1 } }
    );

    next();
});

/**
 * Update comment or replies counts values after deleting a single comment.
 *
 * @param {Function} next - The next function to call in the middleware chain.
 */
commentSchema.post("deleteOne", async function (next) {
    const comment = this;

    if (comment.parentComment) {
        // Update repliesCount for parent comment
        await this.model("Comment").updateOne(
            { _id: comment.parentComment },
            { $inc: { repliesCount: -1 } }
        );
    } else {
        // Update commentCount for article
        await this.model("Article").updateOne(
            { _id: comment.article },
            { $inc: { commentCount: -1 } }
        );
    }

    next();
});

module.exports = mongooseV2.model("Comment", commentSchema);

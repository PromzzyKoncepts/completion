const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "Users", default: [] },
    replies: [
        {
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            author: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }
        }
    ],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
    reason: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now }
});

const contentBlockSchema = new mongoose.Schema({
    type: { type: String, enum: ["text", "image"], required: true },
    content: { type: String, required: true }, // For text blocks, this is the text. For image blocks, this is the image URL
    caption: { type: String, default: "" }, // Optional caption for image blocks
    order: { type: Number, required: true } // To maintain the order of blocks
});

const adminMediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "article"], required: true },
    featuredImage: { type: String }, // Optional featured image for the article
    contentBlocks: [contentBlockSchema], // Array of content blocks (text or image)
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    favorite: { type: Boolean, default: false },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "Users", default: [] },
    likesCount: { type: Number, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    comments: [commentSchema],
    reports: [reportSchema],
    createdAt: { type: Date, default: Date.now }
});

// Add a virtual field to fetch the author's role
adminMediaSchema.virtual("authorRole", {
    ref: "Users",
    localField: "author",
    foreignField: "_id",
    justOne: true,
    options: { select: "accountType" }
});

// Ensure virtuals are included when converting to JSON or Objects
adminMediaSchema.set("toObject", { virtuals: true });
adminMediaSchema.set("toJSON", { virtuals: true });

module.exports = mongooseV2.model("AdminMedia", adminMediaSchema);
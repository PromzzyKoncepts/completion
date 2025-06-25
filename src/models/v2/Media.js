const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "Users", default: [] },
    replies: [
        {
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    createdAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
    reason: { type: String, required: true },
    reportedAt: { type: Date, default: Date.now }
});

const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "article"], required: true },
    featuredImage: { type: String, required: true },
    content: { type: String, required: true },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    favorite: { type: Boolean, default: false },
    likes: { type: [mongoose.Schema.Types.ObjectId], ref: "Users", default: [] },  // Array of user IDs who liked
    likesCount: { type: Number, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    duration: { type: String },
    comments: [commentSchema],
    reports: [reportSchema],
    createdAt: { type: Date, default: Date.now }
});

// Add a virtual field to fetch the author's role
mediaSchema.virtual("authorRole", {
    ref: "Users",
    localField: "author",
    foreignField: "_id",
    justOne: true,
    options: { select: "accountType" } // Fetch only the accountType field
});


// Ensure virtuals are included when converting to JSON or Objects
mediaSchema.set("toObject", { virtuals: true });
mediaSchema.set("toJSON", { virtuals: true });

module.exports = mongooseV2.model("Media", mediaSchema);

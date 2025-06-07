const mongoose = require("mongoose");
const mongooseLeanVirtuals = require("mongoose-lean-virtuals");
const Comment = require("./Comment");

const topicSchema = mongoose.Schema({
    title: String,
    description: String,
    image: {
        url: { type: String },
        reference: { type: String },
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TopicCategory",
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCount: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

topicSchema.virtual("comments").get(async () => {
    const comments = await Comment.find({ topic: this._id });
    return comments;
});

topicSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model("Topic", topicSchema);

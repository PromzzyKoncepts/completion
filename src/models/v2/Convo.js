const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const ConvoSchema = new mongoose.Schema({
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    type: { type: String, enum: ["post", "question"], required: true },
    body: { type: String, required: true }, // content of the conversation
    title: { type: String }, // title for convos that aren't questions
    imageUrl: { type: String }, // URL for an optional image
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    views: { type: Number, default: 0 },
    reactions: {
        like: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        love: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        haha: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        wow: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        sad: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
        angry: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }]
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    createdAt: { type: Date, default: Date.now },
    reportCount: { type: Number, default: 0 }, // Track number of reports
});

const Convo = mongooseV2.model("Convos", ConvoSchema);

module.exports = Convo;

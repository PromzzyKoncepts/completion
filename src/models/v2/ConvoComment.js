const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const ConvoCommentSchema = new mongoose.Schema({
    convo: { type: mongoose.Schema.Types.ObjectId, ref: "Convo" },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // Reference to the user
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users", default: [] }],
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "ConvoComment", default: null }, // For replies
});

const ConvoComment = mongooseV2.model("ConvoComments", ConvoCommentSchema);

module.exports = ConvoComment;

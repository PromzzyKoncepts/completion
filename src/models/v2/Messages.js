const mongoose = require("mongoose");
const {mongooseV2} = require("../../configs/database/db");

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

module.exports = mongooseV2.model("Message", messageSchema);
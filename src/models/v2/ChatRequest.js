const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const ChatRequestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "requested",
        "canceled",
        "accepted",
        "inProgress",
        "completed"
      ],
      default: "requested",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    intakeResponse: {
      type: Array,
    },
    userJoined: {
      type: Boolean,
      default: false,
    },
    userJoinedAt: {
      type: Date,
    },
    counsellorJoined: {
      type: Boolean,
      default: false,
    },
    counsellorJoinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongooseV2.model("ChatRequest", ChatRequestSchema);

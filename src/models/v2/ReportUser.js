const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const ReportUserSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityType", // Dynamic reference
    },
    entityType: {
      type: String,
      enum: ["User", "Media", "Comment", "Article"],
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUserRole: {
      type: String,
      enum: ["serviceuser", "counsellor"],
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["unresolved", "reviewed", "resolved"],
      default: "unresolved",
    }
  },
  {
    timestamps: true,
  }
)


module.exports = mongooseV2.model("ReportUser", ReportUserSchema);

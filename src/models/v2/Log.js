const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const apiLogSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    ipAddress: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongooseV2.model("ApiLog", apiLogSchema);

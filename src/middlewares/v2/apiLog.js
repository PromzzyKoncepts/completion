const Log = require("../../models/v2/Log");
const asyncHandler = require("../asyncHandler");

exports.apiLog = asyncHandler(async (req, res, next) => {
  const endpoint = req.originalUrl;
  const method = req.method;
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || "Unknown";
  const log = new Log({ endpoint, method, ipAddress });
  await log.save();
  next();
})

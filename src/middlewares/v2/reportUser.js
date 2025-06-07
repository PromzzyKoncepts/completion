const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

exports.validateReportUser = JoiRequestBodyValidator(
  Joi.object({
    reportedUser: Joi.string(),
    description: Joi.string().max(1000),
  })
);

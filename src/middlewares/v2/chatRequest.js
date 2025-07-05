const { JoiRequestBodyValidator } = require("./joiValidator");
const Joi = require("joi");

exports.validateChatRequest = JoiRequestBodyValidator(
  Joi.object({
    intakeResponse: Joi.object(),
  })
)

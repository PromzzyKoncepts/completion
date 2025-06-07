const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

exports.validateCreateAssessment = JoiRequestBodyValidator(
  Joi.object({
    title: Joi.string(),
    description: Joi.string().max(1000),
    questions: Joi.array().items(Joi.object({
      questionText: Joi.string(),
      questionType: Joi.string().valid("text", "multiple-choice", "rating"),
      options: Joi.array().items(Joi.string()).when("questionType", {
        is: Joi.string().valid("multiple-choice"),
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      })
    })),
  })
);

const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

exports.validateAssessmentResponse = JoiRequestBodyValidator(
  Joi.object({
    assessmentId: Joi.string().guid().required(),
    answers: Joi.array().items(Joi.object({
      questionId: Joi.string(),
      answerText: Joi.string(),
      selectedOption: Joi.string(),
      rating: Joi.number(),
    })),
  })
);

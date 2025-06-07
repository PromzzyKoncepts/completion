const { JoiRequestBodyValidator } = require("./joiValidator");
const Joi = require("joi");

exports.validateCreateReview = JoiRequestBodyValidator(
    Joi.object({
        session: Joi.string().required(),
        user: Joi.string().required(),
        leader: Joi.string().required(),
        rating: Joi.number().min(1).max(5).required(),
        review: Joi.string().max(1000),
    }).unknown(false)
);

exports.validateUpdateReview = JoiRequestBodyValidator(
    Joi.object({
        rating: Joi.number().min(1).max(5),
        review: Joi.string().max(1000),
    })
        .min(1)
        .unknown(false)
);

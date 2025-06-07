const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

exports.validateCommentOrReplyArticle = JoiRequestBodyValidator(
    Joi.object({
        comment: Joi.string().required(),
        author: Joi.string().required(),
    }).unknown(false)
);

exports.validateLikeComment = JoiRequestBodyValidator(
    Joi.object({
        userId: Joi.string().required(),
        value: Joi.number().required().valid(1, -1),
    }).unknown(false)
);

exports.validateUpdateComment = JoiRequestBodyValidator(
    Joi.object({
        comment: Joi.string().required(),
    }).unknown(false)
);

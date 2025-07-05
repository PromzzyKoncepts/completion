const { JoiRequestBodyValidator } = require("./joiValidator");
const Joi = require("joi");

exports.validateCreateArticle = JoiRequestBodyValidator(
    Joi.object({
        title: Joi.string().required(),
        content: Joi.string().required(),
        coverImage: Joi.string(),
        author: Joi.string().required(),
        tags: Joi.string(),
    }).unknown(false)
);
exports.validateCreateAdminArticle = JoiRequestBodyValidator(
    Joi.object({
        title: Joi.string().required(),
        topicId: Joi.string().required(),
        contentBlocks: Joi.array()
            .items(
                Joi.object({
                    type: Joi.string().valid("text", "image").required(),
                    content: Joi.string().required(),
                    order: Joi.number().required(),
                })
            )
            .optional(),
        featuredImage: Joi.string().allow(null, "").optional(),
    }).unknown(false)
);

exports.validateUpdateArticle = JoiRequestBodyValidator(
    Joi.object({
        title: Joi.string(),
        content: Joi.string(),
        tags: Joi.string(),
        coverImage: Joi.string(),
    })
        .min(1) // at least one field is required
        .required()
        .unknown(false)
);

exports.validateLikeArticle = JoiRequestBodyValidator(
    Joi.object({
        userId: Joi.string().required(),
        value: Joi.number().required().valid(1, -1),
    }).unknown(false)
);

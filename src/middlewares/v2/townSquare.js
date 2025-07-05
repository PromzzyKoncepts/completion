const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

exports.validateAddTopic = JoiRequestBodyValidator(
  Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    colorCode: Joi.string().pattern(/^#([0-9A-F]{6}|[0-9A-F]{3})$/i).required(),
    imageUrl: Joi.string().optional(),
    // icon: Joi.string().required(),
    tipsAndGuidelines: Joi.array().items(
      Joi.object({
        icon: Joi.string().required(),
        description: Joi.string().required(),
        title: Joi.string().required()
      }).required(),
    )
  })
)

exports.validateConvoReaction = JoiRequestBodyValidator(
  Joi.object({
    reaction: Joi.string().valid("like", "love", "haha", "wow", "sad", "angry").required(),
  })
)
exports.validateAddConvo = JoiRequestBodyValidator(
  Joi.object({
    type: Joi.string().valid("post", "question").required(), // Only 'post' or 'question' allowed
    title: Joi.string().when("type", {
      is: Joi.string().valid("post"),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    body: Joi.string().min(1).required(), // Requires at least 1 character in body
    imageUrl: Joi.string().uri().optional(), // Optional valid URI for image URL
    views: Joi.number().integer().min(0).optional(), // Optional; defaults to 0
    reactions: Joi.object().pattern(Joi.string(), Joi.number().min(0)).optional(), // Optional map of reactions
    createdAt: Joi.date().optional(), // Optional; defaults to Date.now
  }).min(1)
    .unknown(false)
);

exports.validateCommentOnConvo = JoiRequestBodyValidator(
  Joi.object({
    content: Joi.string().required(),
  })
)

exports.validateCreateMedia = JoiRequestBodyValidator(
  Joi.object({
    title: Joi.string().required(),
    type: Joi.string().valid("video", "article").required(),
    content: Joi.string().required(),
    featuredImage: Joi.string().required(),
    duration: Joi.when("type", {
      is: "video", // Directly compare with "video"
      then: Joi.string().required(), // Make it required for videos
      otherwise: Joi.forbidden() // Disallow for articles
    })
  })
)

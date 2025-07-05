const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

exports.validateCreateSession = JoiRequestBodyValidator(
    Joi.object({
        title: Joi.string().max(100).required(),
        description: Joi.string().max(1000),
        sessionCategories: Joi.array().items(Joi.string()).required(),
        // sessionSlot: Joi.string().required(),
        intakeResponses: Joi.string().required(),
    }).unknown(false)
);

exports.validateUpdateSession = JoiRequestBodyValidator(
    Joi.object({
        title: Joi.string().max(100),
        description: Joi.string().max(1000),
        status: Joi.string().valid(
            "requested",
            "assigned",
            "confirmed",
            "inProgress",
            "completed",
            "cancelled"
        ),
        counsellorNotes: Joi.object({
            title: Joi.string().max(100),
            content: Joi.string().max(1000),
            date: Joi.date(),
        }),
        userJoinedAt: Joi.date(),
        leaderJoinedAt: Joi.date(),
        sessionStartedAt: Joi.date(),
        sessionEndedAt: Joi.date(),
        sessionHeld: Joi.boolean(),
        userRatingNotes: Joi.string(),
        counsellorRatingNotes: Joi.string(),
    }).unknown(false)
);

exports.validateRespondToSession = JoiRequestBodyValidator(
    Joi.object({
        accepted: Joi.boolean().required(),
        reason: Joi.string().max(1000),
    }).unknown(false)
);

exports.validateCounsellorSearch = JoiRequestBodyValidator(
  Joi.object({
    topics: Joi.array().items(Joi.string()),
    specialty: Joi.string(),
    genderPreference: Joi.string().valid("yes", "no", "noPreference"),
    sessionType: Joi.string().valid("video", "call"),
    cityOfResidence: Joi.string(),
    countryOfResidence: Joi.string(),
  })
);

exports.validateRateSession = JoiRequestBodyValidator(
  Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    feedback: Joi.string(),
    isAnonymous: Joi.boolean(),
  })
);

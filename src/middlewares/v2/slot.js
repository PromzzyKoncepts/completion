const { JoiRequestBodyValidator } = require("./joiValidator");
const Joi = require("joi");

// FIXME: this is not working
// date must be in format 2023-08-05T14:55+02:00
// 2023-08-05T14:55+02:00
/**
 * @description Custom Joi date validator to validate date in format YYYY-MM-DDTHH:mmZ (e.g., 2023-08-05T14:23+02:00)
 */
// const customDate = Joi.extend((joi) => ({
//     type: "date",
//     base: joi.date(),
//     messages: {
//         "date.format":
//             "{{#label}} must be in format YYYY-MM-DDTHH:mmZ (e.g., 2023-08-05T14:23+02:00)",
//     },
//     rules: {
//         format: {
//             validate(value, helpers) {
//                 if (
//                     !value.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\+\d{2}:\d{2}/)
//                 ) {
//                     return { value, errors: helpers.error("date.format") };
//                 }
//                 return value;
//             },
//         },
//     },
// }));

/**
 * @description Joi schema for validating a single availability slot
 */
const slotSchema = Joi.object({
    startDateTime: Joi.string().required(),
    endDateTime: Joi.string().required(),
    repeats: Joi.string().valid(
        "none",
        "daily",
        "workingDays",
        "weekly",
        "biweekly",
        "monthly"
    ),
    expiresAt: Joi.string(),
}).unknown(false);

exports.validateCreateOrManySlots = JoiRequestBodyValidator(
    Joi.object({
        slots: Joi.array().items(slotSchema).required(),
    })
);

exports.validateUpdateSlot = JoiRequestBodyValidator(
    Joi.object({
        repeats: Joi.string().valid(
            "none",
            "daily",
            "workingDays",
            "weekly",
            "biweekly",
            "monthly"
        ),
        expiresAt: Joi.string(),
        expired: Joi.boolean(),
    })
        .min(1)
        .unknown(false)
);

exports.validateBookSlot = JoiRequestBodyValidator(
  Joi.object({
    duration: Joi.number().min(15).multiple(15),
    session: Joi.object({
      title: Joi.string(),
      description: Joi.string(),
      interactionType: Joi.string().valid("video", "audio", "chat")
    }),
    intakeResponse: Joi.object()
  })
)

const AppError = require("../../utils/appError");

/**
 * Validates the request body according to the provided schema using Joi.
 * @param {object} schema - The schema to validate against.
 * @returns {function} middleware function that validates the request body.
 */
exports.JoiRequestBodyValidator = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false }); // set abortEarly to false

        if (!error) {
            return next();
        }

        // Initialize an empty array to store messages
        const messages = [];

        error.details.forEach((err) => {
            messages.push(err.message.replace(/"/g, ""));
        });

        // Join all error messages into a single string, separated by dot
        const errorMessage = messages.join(". ");

        return next(new AppError(errorMessage, 400));
    };
};

const AppError = require("./appError");

/**
 * @class group error handlers related to Auth0.
 * This class is responsible for handling errors that occur when interacting with the Auth0 service.
 * It contains methods for handling specific error cases, such as invalid credentials for login or
 * errors flagged as `APIError` by Auth0.
 */
class Auth0Error {
    /**
     * Handles invalid login credentials.
     *
     * @param {Error} err - The error object that occurred when trying to login
     * @returns {AppError} - Our custom error object to be passed to the error handling middleware
     */
    static handleInvalidPassword(err) {
        const message = "Wrong email or password";
        return new AppError(message, err.statusCode);
    }

    /**
     * Handles errors flagged as `APIError` by Auth0.
     *
     * @param {Error} err - The error object returned by Auth0
     * @returns {AppError} - Our custom error object to be passed to the error handling middleware
     */

    static handleAPIError(err) {
        const { originalError } = JSON.parse(JSON.stringify(err));
        const { response } = originalError;
        const result = JSON.parse(response.text);

        const message = result.message
            ? result.message
            : "Something went wrong";

        // handles known cases
        switch (result.name) {
            case "BadRequestError":
                return new AppError(
                    "The user with this email already exists",
                    400
                );

            case "PasswordStrengthError":
                return new AppError(result.message, 400);
            default:
                // for unknown cases return message declared above
                return new AppError(message, err.statusCode);
        }
    }
}

module.exports = Auth0Error;

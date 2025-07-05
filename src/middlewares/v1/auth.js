const validate = require("validate.js");
const AppError = require("../../utils/appError");

/**
 * @class group `req.body` validators for authentication.
 * It includes methods used to validate the request body for the respective requests and calling next() for successful validation or returning an error if validation fails.
 */
class AuthMiddleware {
    /**
     * Validate the request body for signup
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static validateSignup(req, res, next) {
        const constraints = {
            name: {
                presence: true,
                length: {
                    minimum: 3,
                    message: "must be at least 3 characters",
                },
            },
            email: {
                email: true,
                presence: true,
            },
            password: {
                presence: true,
                length: {
                    minimum: 6,
                    message: "must be at least 6 characters",
                },
            },
        };
        const hasErrors = validate(req.body, constraints);
        if (!hasErrors) {
            return next();
        }

        const messages = [];

        hasErrors.name ? messages.push(hasErrors.name[0]) : undefined;

        hasErrors.email ? messages.push(hasErrors.email[0]) : undefined;

        hasErrors.password ? messages.push(hasErrors.password[0]) : undefined;

        // join messages array as one string and send it back to client
        return next(new AppError(messages.join(". "), 400));
    }

    /**
     * Validate the request body for login
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static validateLogin(req, res, next) {
        const constraints = {
            email: {
                email: true,
                presence: true,
            },
            password: {
                presence: true,
                length: {
                    minimum: 6,
                    message: "must be at least 6 characters",
                },
            },
        };
        const hasErrors = validate(req.body, constraints);
        if (!hasErrors) {
            return next();
        }
        const messages = [];

        hasErrors.email ? messages.push(hasErrors.email[0]) : undefined;

        hasErrors.password ? messages.push(hasErrors.password[0]) : undefined;

        return next(new AppError(messages.join(". "), 400));
    }

    /**
     * Validate the request body for forgot password
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static validateforgotPassword(req, res, next) {
        const constraints = {
            email: {
                email: true,
                presence: true,
            },
        };
        const hasErrors = validate(req.body, constraints);
        if (!hasErrors) {
            return next();
        }
        const message = hasErrors.email[0];

        return next(new AppError(message, 400));
    }

    /**
     * Validate the request body for refreshing token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static validateRefreshToken(req, res, next) {
        const constraints = {
            refreshToken: {
                presence: true,
            },
        };
        const hasErrors = validate(req.body, constraints);
        if (!hasErrors) {
            return next();
        }
        const message = hasErrors.refreshToken[0];
        return next(new AppError(message, 400));
    }

    /**
     * Validate the request body for updating push token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static validateUpdatePushToken(req, res, next) {
        const constraints = {
            pushToken: {
                presence: true,
            },
        };
        const hasErrors = validate(req.body, constraints);
        if (!hasErrors) {
            return next();
        }
        const message = hasErrors.pushToken[0];

        return next(new AppError(message, 400));
    }
}

module.exports = { AuthMiddleware };

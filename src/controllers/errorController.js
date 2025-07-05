const AppLogger = require("../middlewares/logger/logger");
const Auth0Error = require("../utils/auth0Error");
const MongoDBError = require("../utils/mongoDBError");

/**
 * Sends error to developers with all details, and used for developement stage.
 * @param {Error} err - Error object
 * @param {Response} res - ExpressJS response object
 */
const sendDevelopmentError = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

/**
 * Sends limited messages of an error to the end user.
 * @param {AppError} err - AppError object
 * @param {Response} res - ExpressJS response object
 */
const sendProductionError = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // if not operational, log it on console and send generic message.
        AppLogger.error(err.stack);

        res.status(500).json({
            status: "error",
            message: "Something went wrong!",
        });
    }
};

/**
 * Error handling middleware at the application level.
 *
 * @param {Error} err - The error object that occurred in the application
 * @param {Request} req - The request object that contains information about the incoming request
 * @param {Response} res - The response object that will be used to send a response back to the client
 * @param {function} next - A function that can be called to pass control to the next middleware function in the chain
 *
 * This middleware handles all errors that occur in the application and sends appropriate
 * responses to the client depending on the environment (development or production).
 * In development mode, all error details are sent to the developer.
 * In production mode, limited error details are sent to the client.
 */
module.exports = (err, req, res, next) => {
    // for auth0, the http status code is in status property instead of statusCode
    // in dev mode, we will have all details but in production mode, this will give at least the right status code
    err.statusCode = err.statusCode || err.status || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendDevelopmentError(err, res);
    } else {
        let error = Object.create(err, Object.getOwnPropertyDescriptors(err));
        if (error.name === "ValidationError")
            error = MongoDBError.handleValidationError(error);

        if (error.name === "CastError")
            error = MongoDBError.handleCastError(error);

        if (error.code === 11000)
            error = MongoDBError.handleDuplicateField(error);

        if (error.name === "invalid_grant")
            error = Auth0Error.handleInvalidPassword(error);
        if (error.name === "APIError") error = Auth0Error.handleAPIError(error);

        sendProductionError(error, res);
    }
};

/**
 * @class defines error inside the app
 * @property {number} statusCode - HTTP status code of the error
 * @property {string} status - status of the error, "fail" for client errors, "error" for server errors
 * @property {boolean} isOperational - Indicates if the error is expected to happen during the normal operation of the application. These errors are typically caused by user input, external API calls, or other similar conditions that the application can handle gracefully. By default, all errors handled are operational. If the error is not operational, no details will be passed to the client.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;

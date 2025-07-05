const AppError = require("./appError");

/**
 * @class group error handlers related to MongoDB.
 */
class MongoDBError {
    /**
     * Handles errors related to duplicated keys/indexes.
     *
     * @param {Error} err - The error object returned by MongoDB when a duplicate key or index is detected
     * @returns {AppError} - Our custom error object to be passed to the error handling middleware
     */
    static handleDuplicateField(err) {
        const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

        const message = `Duplicate field ${value}. Please use another one!`;

        return new AppError(message, 400);
    }

    /**
     * Handles casting errors for invalid ObjectId, strings, numbers.
     *
     * @param {Error} err - The error object returned by MongoDB when a casting error occurs
     * @returns {AppError} - Our custom error object to be passed to the error handling middleware
     */
    static handleCastError(err) {
        const message = `Invalid ${err.path}: ${err.value}`;
        return new AppError(message, 400);
    }

    /**
     * Handles field validation errors.
     *
     * @param {Error} err - The error object returned by MongoDB when a validation error occurs
     * @returns {AppError} - Our custom error object to be passed to the error handling middleware
     */
    static handleValidationError(err) {
        const errors = Object.values(err.errors).map((obj) => obj.message);
        const message = `Invalid input data. ${errors.join(". ")}`;
        return new AppError(message, 400);
    }
}

module.exports = MongoDBError;

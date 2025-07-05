/**
 *
 * @param {Function} fn - Asynchronous function to handle
 * @returns {Function} - A middleware function that catches errors thrown by the given async function and passes it to the errorController
 */
module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

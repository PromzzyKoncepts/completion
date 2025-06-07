const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwt_decode = require("jwt-decode");
const User = require("../../models/v1/User");
const AppError = require("../../utils/appError");
const AuthUtils = require("../../utils/auth");
const asyncHandler = require("./../asyncHandler");
const { promisify } = require("util");

const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, `../configs/envs/.env.${process.env.NODE_ENV}`),
});

/**
 * @class group middleware for Auth0, such as protected routes.
 */
class Auth0Middleware {
    /**
     * Check the JWT token using Auth0's jwks endpoint
     * @type {function}
     */
    static checkJwt = jwt({
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
        }),
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        algorithms: ["RS256"],
    });

    /**
     * Get user information from the decoded JWT token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static tokenInfo = asyncHandler(async (req, res, next) => {
        if (!req.body.id_token) {
            return next(
                new AppError(
                    "Invalid token. please check your connection and try again",
                    400
                )
            );
        }
        const decoded = await promisify(jwt_decode)(req.body.id_token);
        req.userInfo = decoded;
        next();
    });

    /**
     * Append user id to the request object
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static appendUserId = asyncHandler(async (req, res, next) => {
        if (!req.user) {
            return next(
                new AppError(
                    "Invalid information. please check your connection and try again",
                    401
                )
            );
        }

        const id = AuthUtils.getUserId(req.user.sub);
        const socialType = AuthUtils.getSocialShort(req.user.sub);

        if (socialType === "auth0") {
            req.user.id = id;
            next();
        } else {
            const user = await User.findOne({ uuid: req.user.sub });
            if (!user) {
                return next(
                    new AppError(
                        "Invalid user. please confirm information and try again",
                        400
                    )
                );
            } else {
                req.user.id = user._id;
                next();
            }
        }
    });
}

module.exports = Auth0Middleware;

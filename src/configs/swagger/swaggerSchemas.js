/**
 * Convert the mongoose models to swagger schemas
 * so that we can use them to generate API documentation
 * @type {function}
 */
const m2s = require("mongoose-to-swagger");

const Session = require("../../models/v1/Session");
const User = require("../../models/v1/User");

/**
 * Convert the Session model to swagger schema
 * @type {object}
 */
const userSwagger = m2s(User);

/**
 * Signup schema for swagger
 * @type {object}
 */
const Signup = {
    description: null,
    type: "object",
    required: ["name", "email", "password"],
    properties: {
        name: {
            description: null,
            type: "string",
        },
        email: {
            description: null,
            type: "string",
        },
        password: {
            description: null,
            type: "string",
            format: "password",
        },
    },
};

/**
 * Login schema for swagger
 * @type {object}
 */
const Login = {
    description: null,
    type: "object",
    required: ["email", "password"],
    properties: {
        email: {
            description: null,
            type: "string",
        },
        password: {
            description: null,
            type: "string",
            format: "password",
        },
    },
};

/**
 * Social login schema for swagger
 */
const SocialAuth = {
    description: "Schema for social authentication",
    type: "object",
    required: ["access_token", "provider"],
    properties: {
        access_token: {
            description: "Access token for social authentication",
            type: "string",
        },
        provider: {
            description: "Social provider for authentication",
            type: "string",
            enum: ["google", "twitter", "apple"],
        },
    },
};

/**
 * Forgot password schema for swagger
 * @type {object}
 */
const ForgotPassword = {
    description: null,
    type: "object",
    required: ["email"],
    properties: {
        email: {
            description: null,
            type: "string",
        },
    },
};

/**
 * User push token schema for swagger
 * This is used to update the user's push token
 * @type {object}
 */
const UserPushToken = {
    description: null,
    type: "object",
    required: ["pushToken"],
    properties: {
        pushToken: {
            description: null,
            type: "string",
        },
    },
};

/**
 * Refresh token schema for swagger
 * @type {object}
 */
const RefreshToken = {
    description: null,
    type: "object",
    required: ["refresh_token"],
    properties: {
        refresh_token: {
            description: null,
            type: "string",
        },
    },
};

/**
 * Convert the User model to swagger schema
 * @type {object}
 */
const sessionSwagger = m2s(Session);

/**
 * Export the swagger schemas
 * so that they can be used in other parts of the application
 */
module.exports = {
    sessionSwagger,
    userSwagger,
    Signup,
    Login,
    ForgotPassword,
    UserPushToken,
    RefreshToken,
    SocialAuth,
};

const AppError = require("../../utils/appError");
const User = require("../../models/v2/Base");
const asyncHandler = require("../asyncHandler");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { JoiRequestBodyValidator } = require("./joiValidator");

// TODO: Add leader privelege to combine for common actions of volunteers and counsellors

/**
 * Verifies if the user has the required privileges to access a route
 * @param {*} requiredLevel - The required privilege level
 */
exports.hasPrivilege = (requiredLevel) => {
    const levelPrivileges = {
        normal: 1,
        volunteer: 2,
        counsellor: 3,
        admin: 4,
    };

    return (req, res, next) => {
        if (
            (levelPrivileges[req.user.accountType] || 1) >=
            (levelPrivileges[requiredLevel] || 1)
        ) {
            return next();
        }

        return next(
            new AppError("Access denied. Insufficient privileges.", 403)
        );
    };
};


exports.protect = asyncHandler(async (req, res, next) => {
    let accessToken;

    // Check for the authorization header
    if (
        req.header("Authorization") &&
        req.header("Authorization").startsWith("Bearer")
    ) {
        accessToken = req.header("Authorization").split(" ")[1];
    }

    if (!accessToken) {
        return next(new AppError("Please log in to get access", 401));
    }

    // Verify the token
    const decoded = await promisify(jwt.verify)(
        accessToken,
        process.env.JWT_SECRET
    );

    // Fetch the current user using the decoded token ID
    const currentUser = await User.findById(decoded.id).select(
        "+passwordChangedAt +deactivationStatus +deleted"
    );

    if (!currentUser) {
        return next(new AppError("Token does not belong to this user", 401));
    }

    // Check if the user's account is deactivated or deleted
    if (currentUser.deactivationStatus || currentUser.deleted) {
        return next(new AppError("Account deactivated or deleted, please contact support", 403));
    }

    // Check if the password was changed after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError("Password changed recently, please log in again", 401)
        );
    }

    // Attach the current user to the request object
    req.user = currentUser;
    next();
});

/**
 * Verifies if the user has access rights to a route.
 *
 * @param {...string} roles list of roles for a route
 * @returns {function} middleware function that checks if the user's role is in the list of allowed roles
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // check also if current user is not owner of the resource
        if (!roles.includes(req.user.accountType)) {
            return next(
                new AppError(
                    "You do not have permission to perform this action",
                    403
                )
            );
        }
        next();
    };
};

/**
 * Represents the common fields required for all signup routes.
 */
// const commonConstraintsSchema = Joi.object({
//     firstName: Joi.string().min(2).required(),
//     lastName: Joi.string().min(2).required(),
//     email: Joi.string().email().required(),
//     password: Joi.string().min(6).required(),
//     passwordConfirm: Joi.any().valid(Joi.ref("password")).required().messages({
//         "any.only": '"passwordConfirm" must match "password"',
//     }),
//     phoneNumber: Joi.string()
//         .pattern(/^\+([1-9]\d{0,2})(\d{1,14})$/)
//         .max(16)
//         .min(3)
//         .messages({
//             "string.pattern.base":
//                 '"phoneNumber" must be in E.164 format, e.g., +123456789',
//         }),
// }).messages({
//     "object.unknown": "{#label} is not allowed",
//     "string.min": '"{#label}" must be at least {#limit} characters',
//     "string.max": '"{#label}" must be at most {#limit} characters',
//     "any.required": '"{#label}" is required',
//     "string.email": '"{#label}" must be a valid email',
// });
const commonConstraintsSchema = Joi.object({
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string()
        .pattern(/^\+([1-9]\d{0,2})(\d{1,14})$/)
        .max(16)
        .min(3)
        .messages({
            "string.pattern.base": '"phoneNumber" must be in E.164 format, e.g., +123456789',
        }),
    accountType: Joi.string().valid("serviceuser", "counsellor", "admin").required().messages({
        "any.only": '"accountType" must be one of [Serviceuser, counsellor, admin]',
    }),
    pushToken: Joi.string().required().messages({
        "any.required": '"pushToken" is required',
    }),
}).messages({
    "object.unknown": "{#label} is not allowed",
    "string.min": '"{#label}" must be at least {#limit} characters',
    "string.max": '"{#label}" must be at most {#limit} characters',
    "any.required": '"{#label}" is required',
    "string.email": '"{#label}" must be a valid email',
});


exports.validateUserSignup = JoiRequestBodyValidator(commonConstraintsSchema);

exports.validateVolunteerSignup = JoiRequestBodyValidator(
    commonConstraintsSchema
        .keys({
            motivation: Joi.string().required(),
            phoneNumber: Joi.string().required(),
            certificates: Joi.array().items(Joi.string()).required(),
        })
        .unknown(false)
);

exports.validateCounsellorSignup = JoiRequestBodyValidator(
    commonConstraintsSchema
        .keys({
            motivation: Joi.string().required(),
            phoneNumber: Joi.string().required(),
            mentalHealthCertificates: Joi.array()
                .items(
                    Joi.object({
                        name: Joi.string().required(),
                    })
                )
                .required(),
        })
        .unknown(false)
);

exports.validateFilesUpload = JoiRequestBodyValidator(
    commonConstraintsSchema
        .keys({
            motivation: Joi.string().required(),
            phoneNumber: Joi.string().required(),
            mentalHealthCertificates: Joi.array()
                .items(
                    Joi.object({
                        name: Joi.string().required(),
                        file: Joi.string().required(),
                    })
                )
                .required(),
        })
        .unknown(false)
);

exports.validateLogin = JoiRequestBodyValidator(
    Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }).unknown(false)
);

exports.validateUpdatePassword = JoiRequestBodyValidator(
    Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required(),
        newPasswordConfirm: Joi.any()
            .valid(Joi.ref("newPassword"))
            .required()
            .messages({
                "any.only": "newPasswordConfirm must match newPassword",
            }),
    }).unknown(false)
);

exports.validateForgotPassword = JoiRequestBodyValidator(
    Joi.object({
        email: Joi.string().email().required(),
    }).unknown(false)
);

exports.validateResetPassword = JoiRequestBodyValidator(
    Joi.object({
        code: Joi.number().required(),
        password: Joi.string().min(6).required(),
        passwordConfirm: Joi.any()

            .valid(Joi.ref("password"))
            .required()
            .messages({
                "any.only": '"passwordConfirm" must match "password"',
            }),
    }).unknown(false)
);

const asyncHandler = require("../../middlewares/asyncHandler");
const AppLogger = require("../../middlewares/logger/logger");
const User = require("../../models/v2/Base");
const Admin = require("../../models/v2/Admin")
const Counsellor = require("../../models/v2/Counsellor")
const ServiceUser = require("../../models/v2/ServiceUser")
const ApiResponse = require("../../utils/ApiResponse")
const MailNotificationService = require("../../services/mailNotificationService");
const AppError = require("../../utils/appError");
const jwt = require("jsonwebtoken");
const {
    oAuth2Client,
    authUrl,
    oauth2,
} = require("../../configs/google/google");
const { sendVerifyEmail, sendVerifyPhoneNumber } = require("./userController");
const argon = require("argon2");
const Encrypter = require("../../utils/Encrypter");
const Base = require("../../models/v2/Base");
const encrypter = new Encrypter();


exports.deleteUser = asyncHandler(async (req, res, next) => {

    const { reason } = req.body;
    // Retrieve the user ID from request parameters
    const currentUser = req.user;


    if (!reason) {
        return ApiResponse.failure(res, "Please pass reason for deletion");
    }

    // Find the user by their ID
    const user = await Base.findById(currentUser.id);

    // If user not found, return a 404 response
    if (!user) {
        return ApiResponse.failure(res, "User not found.");
    }

    // Call the soft delete method to mark the user as deleted
    await user.softDelete(reason);

    // Prepare the response data
    const data = {
        id: user._id,
        deleted: user.deleted,
        timeDeleted: user.timeDeleted,
    };

    // Return success response
    return ApiResponse.success(res, data, "User deleted successfully.");
});

exports.activateEntity = asyncHandler(async (req, res, next) => {

    const currentUser = req.user;

    // Find the entity by its ID
    const entity = await Base.findById(currentUser.id);

    // If entity not found, return a 404 response
    if (!entity) {
        return ApiResponse.failure(res, "User not found.");
    }

    // Call the activate method to set deactivationStatus to false and clear timeDeactivated
    await entity.activate();

    // Prepare the data to return
    const data = {
        id: entity._id,
        deactivationStatus: entity.deactivationStatus,
        timeDeactivated: entity.timeDeactivated,
    };

    // Return success response
    return ApiResponse.success(res, data, "Entity activated successfully.");
});


exports.deactivateEntity = asyncHandler(async (req, res, next) => {

    const { reason } = req.body;
    const currentUser = req.user;

    if (!reason) {
        return ApiResponse.failure(res, "Please pass reason for deactivation");
    }
    // Find the entity by its ID
    const entity = await Base.findById(currentUser.id);

    // If entity not found, return a 404 response
    if (!entity) {
        return ApiResponse.failure(res, "User not found.");
    }

    // Call the activate method to set deactivationStatus to false and clear timeDeactivated
    await entity.deactivate(reason);

    // Prepare the data to return
    const data = {
        id: entity._id,
        deactivationStatus: entity.deactivationStatus,
        timeDeactivated: entity.timeDeactivated,
    };

    // Return success response
    return ApiResponse.success(res, data, "Entity deactivated successfully.");
});

/**
 * Get access token and refresh token for a user.
 * @param {*} user - The user document.
 * @returns {Promise<{token: string, refreshToken: string}>} - The access token and refresh token.
 */
async function getTokens(user) {
    // create access token
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        }
    );

    // save refresh token in user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
}

/**
 * Creates a new user account.
 */
exports.signup = asyncHandler(async (req, res, next) => {

    const { email } = req.body;
    let username = req.body.username || req.body.email.split("@")[0];

    const emailExists = await User.findOne({
        email: email,
    });

    if (emailExists) {
        return ApiResponse.failure(res, "User with this email already exist.")
    }
    let usernameExists = await User.findOne({
        username: username,
    });

    let randomNum;

    while (usernameExists) {
        // Generate a random number between 1000 and 9999
        randomNum = Math.floor(Math.random() * 900) + 100;
        username = `${username}${randomNum}`;
        usernameExists = await User.findOne({
            username: username,
        });
    }

    req.body.username = username;

    req.body.password = await argon.hash(req.body.password);
    let newUser;

    switch (req.body.accountType) {
        case "admin":

            newUser = await Admin.create(req.body);
            break;
        case "counsellor":
            newUser = await Counsellor.create(req.body);

            break;
        default:
            newUser = await ServiceUser.create(req.body);
            break;
    }

    req.user = newUser;

    await sendVerifyEmail(newUser);

    // if (req.body.phoneNumber) {
    //     await sendVerifyPhoneNumber(newUser);
    // }

    const tokens = await getTokens(newUser);


    return ApiResponse.success(res, tokens, "User created successfully")

});

/**
 * Send email verification code 
 */


// exports.verifyEmail = asyncHandler(async (req, res, next) => {
//     // Get name and email
//     const { email, name } = req.body;
//
//     // Check if email and name are provided
//     if (!email || !name) {
//         return next(new AppError("Please provide email and name", 400));
//     }
//
//     // Regular expression for validating email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//
//     // Validate email format
//     if (!emailRegex.test(email)) {
//         return next(new AppError("Please provide a valid email address", 400));
//     }
//
//      await sendVerifyEmail(newUser);
//
// });

/**
 * Login a user with email and password.
 */
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // AppLogger.error("An error occured"); // had to remove this because i dont see the point of logging error without any checks or conditions
    // Check if email and password are provided
    if (!email || !password) {
        return ApiResponse.failure(res, "Please provide email/password");
    }

    // Find the user by email and select password field for verification
    const user = await User.findOne({ email }).select("+password +deactivationStatus +deleted");
   

    // Check if the user exists
    if (!user) {
        return ApiResponse.failure(res, "Incorrect email or password");
    }

    // Check if the account is deactivated or deleted
    if (user.deleted) {
        return ApiResponse.failure(res, "Account deleted, please contact support");
    }

    if (user.deactivationStatus) {

        user.deactivationStatus = false; // Reset deactivation status
        user.save();
    }

    // Verify the password
    if (!(await user.verifyPassword(password))) {
        return ApiResponse.failure(res, "Incorrect email or password");
    }

    // used try and catch to handle errors
    try {
    // Generate tokens if authentication is successful
    const { accessToken, refreshToken } = await getTokens(user);

    const data = {
        "role": user.accountType,
        "accessToken": accessToken,
        "refreshToken": refreshToken
    };

    // Respond with success message and user data
    return ApiResponse.success(res, data, "User logged in successfully.");
    }
    catch (error) {
        AppLogger.error("Token generation error:", error);
        return ApiResponse.failure(error, "An error occurred while logging in");
    }
});


exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError("User with that email does not exist", 404));
    }

    // Generate a random 4 digit code
    const resetCode = Math.floor(1000 + Math.random() * 9000);

    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    await MailNotificationService.sendMail({
        recipient: user.email,
        subject: "Password Recovery",
        html: `Forgot your password ? Here is your reset code: ${resetCode}`,
    });

    res.status(200).json({
        status: "success",
        message: "A password reset code has been sent to your email!",
    });
});

/**
 * Logout a user.
 */
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie("accessToken", "loggedout", {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: "success",
    });
});


exports.updateUserEmail = asyncHandler(async (req, res, next) => {
    const currentUser = req.user;
    const { newEmail } = req.body;

    // Validate new email
    if (!newEmail) {
        return ApiResponse.failure(res, "New email is required");
    }

    // Check if the new email is already in use by another user
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
        return ApiResponse.failure(res, "Email is already in use by another user");
    }

    // Update the user's email (but mark the email as unverified)
    currentUser.email = newEmail;
    currentUser.isEmailVerified = false;
    currentUser.verifyEmailCode = Math.floor(1000 + Math.random() * 9000); // Generate new email verification code

    // Save the updated user info
    await currentUser.save({ validateBeforeSave: false });

    // Send a verification email to the new email address
    await sendVerifyEmail(currentUser);

    return ApiResponse.success(res, null, " Verification email sent.");
});

/**
 * to resend email verification code
 */
exports.resendEmailVerificatioCode = asyncHandler(async (req, res, next) => {
    const currentUser = req.user;

    if (currentUser.isEmailVerified) {
        return ApiResponse.failure(res, "User already verified");
    }
    //generate new token
    currentUser.verifyEmailCode = Math.floor(1000 + Math.random() * 9000);

    await currentUser.save({ validateBeforeSave: false });

    await sendVerifyEmail(currentUser);

    return ApiResponse.success(res, null, "Email verification re-sent.");
});

/**
 * Updates password of a user
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    if (!user || !user.verifyPassword(req.body.currentPassword)) {
        return next(
            new AppError(
                "Your current password is wrong. Reset it or try again",
                401
            )
        );
    }

    user.password = await argon.hash(req.body.password);

    await user.save();

    res.status(200).json({
        status: "success",
        message: "Password has been changed successfully",
    });
});

/**
 * Reset password of a user
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({
        passwordResetCode: req.body.code,
        passwordResetCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError("Reset Code expired or invalid", 400));
    }

    user.password = await argon.hash(req.body.password);

    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;

    await user.save();

    res.status(200).json({
        status: "success",
        message: "Password has been reset successfully",
    });
});

/**
 * Redirects the user to the Google login page.
 */
exports.googleLogin = (req, res) => {
    // Save the returnTo parameter in the session
    req.returnTo = req.query.returnTo;

    res.redirect(authUrl);
};

/**
 * Handles the Google login callback and creates a session for the user.
 */
exports.googleLoginCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({
            message: "No code",
        });
    }

    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
    } catch (err) {
        AppLogger.error(err);
        return res.status(500).json({
            message: "Internal server error",
        });
    }

    const sendResponse = async (user) => {
        const tokens = await getTokens(user);

        res.cookie("jwt", tokens.jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });

        res.redirect(req.returnTo || "/");
    };

    // get profile info
    try {
        const { data } = await oauth2.userinfo.get();

        let user = await User.findOne({
            googleId: data.id,
        });

        if (user) {
            return sendResponse(user);
        }

        user = await User.findOne({
            email: data.email,
        });

        if (user) {
            user.googleId = user.googleId || data.id;
            user.profilePicture = user.profilePicture || data.picture;
            await user.save();

            return sendResponse(user);
        }

        // Generate a unique username that can be changed later by the user when in village square
        let username = data.email.split("@")[0].toLowerCase();
        let usernameExists = await User.findOne({
            username: username,
        });

        let randomNum;

        while (usernameExists) {
            // Generate a random number between 100 and 999
            randomNum = Math.floor(Math.random() * 900) + 100;
            username = `${username}${randomNum}`;
            usernameExists = await User.findOne({
                username: username,
            });
        }
        user = await User.create({
            name: `${data.given_name} ${data.family_name}`,
            email: data.email,
            username: username,
            profilePicture: data.picture,
            googleId: data.id,
            isEmailVerified: data.verified_email,
        });

        return sendResponse(user);
    } catch (err) {
        AppLogger.error(err);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

/**
 * Refreshes the access token of a user.
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError("No refresh token", 400));
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        return next(new AppError("Invalid refresh token", 401));
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user) {
        return next(new AppError("User does not exist", 404));
    }

    if (!user.verifyRefreshToken(refreshToken)) {
        return next(new AppError("Invalid refresh token", 401));
    }

    const tokens = await getTokens(user);

    // Store the new refresh token in the database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
        status: "success",
        data: {
            tokens,
        },
    });
});

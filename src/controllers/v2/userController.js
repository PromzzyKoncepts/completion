const twilio = require("twilio");
const asyncHandler = require("../../middlewares/asyncHandler");
const AppError = require("../../utils/appError");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const MailNotificationService = require("../../services/mailNotificationService");
const User = require("../../models/v2/Base");
const Feedback = require("../../models/v2/UserFeedback");
const Counsellor = require("../../models/v2/Counsellor");
const AppLogger = require("../../middlewares/logger/logger");
const Factory = require("../../utils/factory");
const ApiResponse = require("../../utils/ApiResponse");
const argon = require("argon2");
const crypto = require("crypto");
const Session = require("../../models/v2/Session");
const Slot = require("../../models/v2/Slot");
const { mongooseV2 } = require("../../configs/database/db");

/**
 * Gets id of the user from the token and passes it to params
 * @param {*} req
 */
exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
};

exports.getUser = Factory.get(User);

exports.getAll = Factory.getAll(User);

exports.updateMe = Factory.update(User);

exports.deleteMe = Factory.delete(User);
// Function to check if a username exists
const checkUsernameExists = async (username) => {
    const existingUser = await User.findOne({ username });
    return !!existingUser;
};
// Function to generate a random string of a specified length
const generateRandomString = (length) => {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
};

// Function to suggest multiple usernames
exports.suggestUsername = asyncHandler(async (req, res, next) => {
    const baseUsername = req.user.firstName;
    const numberOfSuggestions = 5; // Number of usernames to suggest
    const maxAttempts = 100; // Maximum attempts to find unique usernames
    const suggestedUsernames = [];

    let attempt = 0;

    while (
        suggestedUsernames.length < numberOfSuggestions &&
        attempt < maxAttempts
    ) {
        const suffix = generateRandomString(4); // Generate a random string of length 4
        const newUsername = `${baseUsername}${suffix}`;

        // Check if the username exists
        if (!(await checkUsernameExists(newUsername))) {
            suggestedUsernames.push(newUsername);
        }

        attempt++;
    }

    // Check if we were able to find the requested number of unique usernames
    if (suggestedUsernames.length > 0) {
        return res.status(200).json({
            status: "success",
            message: "Username suggestions successful",
            data: {
                usernames: suggestedUsernames,
            },
        });
    }

    return res.status(500).json({
        status: "error",
        message: "Unable to generate unique usernames. Please try again.",
    });
});
exports.checkUsername = asyncHandler(async (req, res, next) => {
    const { username } = req.params;

    const existingUser = await User.findOne({ username: username });

    res.status(200).json({
        status: "success",
        message: "Username check successful",
        data: {
            exists: !!existingUser,
        },
    });
});

exports.postFeedback = asyncHandler(async (req, res, next) => {
    try {
        const { comment, rating, userRated } = req.body;
        const userId = req.user.id;
        // Validate required fields
        if (!comment || rating === undefined || !userRated) {
            return ApiResponse.failure(res, "All fields are required");
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return ApiResponse.failure(res, "Rating must be between 1 and 5");
        }

        // Check if userId and userRated are valid
        const user = await User.findById(userId);
        const ratedUser = await User.findById(userRated);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        if (!ratedUser) {
            return ApiResponse.failure(res, "Rated user not found");
        }

        // Check if feedback already exists for this user and rated user
        const existingFeedback = await Feedback.findOne({ userId, userRated });

        if (existingFeedback) {
            return ApiResponse.failure(
                res,
                "Feedback already posted for this user"
            );
        }

        // Create a new feedback document
        const feedback = new Feedback({
            userId,
            comment,
            rating,
            userRated,
        });

        // Save the feedback
        await feedback.save();

        // Return the created feedback
        return ApiResponse.success(
            res,
            feedback,
            "Feedback posted successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error posting feedback");
    }
});
exports.getFeedback = asyncHandler(async (req, res, next) => {
    try {
        const userRated = req.user.id;

        // Find all feedback for the specified userRated
        const feedbacks = await Feedback.find({ userRated });

        if (!feedbacks.length) {
            return ApiResponse.failure(res, "No feedback found for this user");
        }

        const user = await User.findById(feedbacks[0].userId);

        const url = user.profilePicture.url;

        // Return the found feedbacks
        return ApiResponse.success(
            res,
            { feedbacks, profilePictureUrl: url },
            "Feedback retrieved successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error retrieving feedback");
    }
});
exports.updateUsername = asyncHandler(async (req, res, next) => {
    try {
        const { newUsername } = req.body; // Assuming newUsername is passed in the request body

        // Check if the new username is already taken
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            return ApiResponse.failure(res, "Username is already taken");
        }

        // Find the user by their ID (assumed to be in req.user.id) and update the username
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { username: newUsername },
            { new: true, runValidators: true } // Options: return the updated document and run validators
        );

        if (!updatedUser) {
            return ApiResponse.failure(res, "User not found");
        }

        return ApiResponse.success(
            res,
            updatedUser,
            "Username updated successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error updating username");
    }
});

/**
 * Updates a user's role (admin, counsellor, or user)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with updated user or error
 */
exports.updateUserRole = asyncHandler(async (req, res, next) => {
    try {
        // const { userId } = req.params;
        const { newRole } = req.body;

        // Validate input
        if (!['admin', 'counsellor', 'serviceuser'].includes(newRole)) {
            return ApiResponse.failure(res, "Invalid role specified");
        }

        // Find user and update role
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { accountType: newRole },
            { new: true, runValidators: true }
        );

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        return ApiResponse.success(
            res,
            user,
            "User role updated successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error updating user role");
    }
});

exports.updateName = asyncHandler(async (req, res, next) => {
    try {
        const { firstname, lastname } = req.body; // Assuming firstname and lastname are passed in the request body

        // Validate input: Ensure firstname and lastname are provided
        if (!firstname || !lastname) {
            return ApiResponse.failure(
                res,
                "First name and last name are required"
            );
        }

        // Find the user by their ID (assumed to be in req.user.id) and update the firstname and lastname
        console.log(req.user.id)
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, // Ensure this is the correct user ID
            {
                $set: {
                    firstName: firstname, // Specify the field name and value to update
                    lastName: lastname, // Specify the field name and value to update
                },
            },
            { new: true, runValidators: true } // Options: return the updated document and run validators
        );

        if (!updatedUser) {
            return ApiResponse.failure(res, "User not found");
        }

        // Return the updated user
        return ApiResponse.success(
            res,
            updatedUser,
            "Name updated successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error updating name");
    }
});


/**
 * Admin password reset (no current password required)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.adminResetPassword = asyncHandler(async (req, res) => {
    try {
        const { newPassword } = req.body;

        // Verify admin privileges
        if (req.user.accountType !== 'admin') {
            return ApiResponse.failure(res, "Unauthorized access", 403);
        }

        // Validate new password
        if (!newPassword) {
            return ApiResponse.failure(res, "New password is required");
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        const hashedPassword = await argon.hash(newPassword);
        user.password = hashedPassword;
        await user.save();

        return ApiResponse.success(res, null, "Password reset successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error resetting password");
    }
});


exports.updatePassword = asyncHandler(async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body; // Assuming currentPassword and newPassword are passed in the request body

        // Validate input: Ensure both passwords are provided
        if (!currentPassword || !newPassword) {
            return ApiResponse.failure(
                res,
                "Current and new passwords are required"
            );
        }

        // Find the user by their ID
        // const user = await User.findById(req.user.id); // Assuming the password field is normally excluded
        const user = await User.findOne({ _id: req.user.id }).select(
            "+password"
        );

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        // Check if the current password is correct await argon.hash(req.body.password);
        const isMatch = await argon.verify(user.password, currentPassword);
        if (!isMatch) {
            return ApiResponse.failure(res, "Current password is incorrect");
        }

        const hashedPassword = await argon.hash(newPassword);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        return ApiResponse.success(res, null, "Password updated successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error updating password");
    }
});


exports.getUserLocaleDetails = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
        
        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        return ApiResponse.success(
            res,
            {
                country: user.countryOfResidence,
                // language: user.language
            },
            "User locale details retrieved successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error retrieving user locale details");
    }
});

exports.updateCountry = asyncHandler(async (req, res, next) => {
    const currentUser = req.user;
    const { country } = req.body;

    // Validate the new country input
    if (!country) {
        return ApiResponse.failure(res, "Country is required");
    }

    // Update the user's country
    currentUser.countryOfResidence = country;

    // Save the updated user info
    await currentUser.save({ validateBeforeSave: false });

    return ApiResponse.success(res, null, "Country updated successfully.");
});

exports.updateEmail = asyncHandler(async (req, res, next) => {
    try {
        const { newEmail } = req.body; // Assuming newEmail is passed in the request body

        // Find the user by their ID (assumed to be in req.user.id) and update the email
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { email: newEmail },
            { new: true, runValidators: true } // Options: return the updated document and run validators
        );

        if (!updatedUser) {
            return ApiResponse.failure(res, "User not found");
        }
        return ApiResponse.success(
            res,
            updatedUser,
            "Email updated successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error updating email");
    }
});

// For first time users
exports.sendVerifyEmail = async (user) => {
    const code = Math.floor(1000 + Math.random() * 9000);

    user.verifyEmailCode = code;
    user.verifyEmailCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // send email || add case of volunteer or counsellor
    await MailNotificationService.sendMail({
        recipient: user.email,
        subject: "Email Verification",
        html: `Your verification code is ${code}`,
    });
};

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
        return ApiResponse.failure(
            res,
            "Email is already in use by another user"
        );
    }

    // Update the user's email (but mark the email as unverified)
    // currentUser.email = newEmail;
    //currentUser.isEmailVerified = false;
    currentUser.verifyEmailCode = Math.floor(1000 + Math.random() * 9000); // Generate new email verification code

    // Save the updated user info
    await currentUser.save({ validateBeforeSave: false });

    await MailNotificationService.sendMail({
        recipient: newEmail,
        subject: "Email Verification",
        html: `Your verification code is ${currentUser.verifyEmailCode}`,
    });

    return ApiResponse.success(
        res,
        null,
        "Email updated successfully. Verification email sent."
    );
});

exports.verifyUserEmail = asyncHandler(async (req, res, next) => {
    const { newEmail, verificationCode } = req.body;

    // Validate that the verification code is provided
    if (!verificationCode || !newEmail) {
        return ApiResponse.failure(
            res,
            "Email and Verification code is required"
        );
    }

    const currentUser = req.user;

    // Check if the user is already verified
    if (currentUser.isEmailVerified) {
        return ApiResponse.failure(res, "Email is already verified");
    }

    // Compare the provided verification code with the one stored in the user's record
    if (currentUser.verifyEmailCode !== verificationCode) {
        return ApiResponse.failure(res, "Invalid verification code");
    }

    // If the code matches, mark the email as verified
    currentUser.email = newEmail;
    currentUser.isEmailVerified = true;
    currentUser.verifyEmailCode = null; // Clear the verification code after successful verification

    // Save the updated user record
    await currentUser.save();

    // Return success response
    return ApiResponse.success(res, null, "Email verified successfully");
});
// For signed in users
exports.sendVerifyEmailReq = asyncHandler(async (req, res, next) => {
    const code = Math.floor(1000 + Math.random() * 9000);
    const user = await User.findById(req.user.id);

    user.verifyEmailCode = code;
    user.verifyEmailCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // send email || add case of volunteer or counsellor
    await MailNotificationService.sendMail({
        recipient: user.email,
        subject: "Email Verification",
        html: `Your verification code is ${code}`,
    });

    return ApiResponse.success(res, "Verification Code Sent");
});

exports.verifyEmail = asyncHandler(async (req, res, next) => {
    const { code } = req.body;

    const user = await User.findOne({
        verifyEmailCode: code,
        verifyEmailCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
        return ApiResponse.failure(res, "Verification Code expired or invalid");
        // return next(new AppError("Verification Code expired or invalid", 400));
    }

    user.isEmailVerified = true;
    user.verifyEmailCode = undefined;
    user.verifyEmailCodeExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // If phone number is also verified and the user is a pending counsellor or volunteer, send notification to admin
    if (
        user.isPhoneNumberVerified &&
        (user.accountType === "pending counsellor" ||
            user.accountType === "pending volunteer")
    ) {
        await MailNotificationService.sendEmail({
            email: process.env.ADMIN_EMAIL,
            subject: `A new ${
                user.accountType.split(" ")[1]
            }  application has been submitted`,
            message: `A new ${user.accountType} has just verified their email and phone number. Please review their application.`,
        });

        await MailNotificationService.sendEmail({
            email: user.email,
            subject: "Positiveo Support - Application Submitted",
            message:
                "Your application has been submitted. We will get back to you shortly.",
        });
    }
    return ApiResponse.success(
        res,
        null,
        "Email has been verified successfully"
    );
});

exports.sendVerifyPhoneNumber = async (user) => {
    const phoneNumber = parsePhoneNumberFromString(user.phoneNumber);

    // If phone number is not valid, return an error
    if (!phoneNumber || !phoneNumber.isValid()) {
        throw new AppError("Invalid phone number", 400);
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const service = client.verify.v2.services(process.env.TWILIO_SERVICE_SID);

    try {
        const verification = await service.verifications.create({
            to: user.phoneNumber,
            channel: "sms",
        });
        AppLogger.info(verification.status);
    } catch (error) {
        AppLogger.error(error);
    }
};

exports.sendVerifyPhoneNumberReq = asyncHandler(async (req, res, next) => {
    // Find the user by ID
    const user = await User.findById(req.user.id);

    // Parse and validate the phone number from the request body
    const phoneNumber = parsePhoneNumberFromString(req.body.phoneNumber);

    if (!phoneNumber || !phoneNumber.isValid()) {
        return ApiResponse.failure(res, "Invalid phone number");
        // return next(new AppError("Invalid phone number", 400));
    }

    // Set up Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const service = client.verify.v2.services(process.env.TWILIO_SERVICE_SID);

    try {
        // Create verification request
        // const verification = await service.verifications.create({
        //     to: phoneNumber.formatInternational(), // Format the number correctly
        //     channel: "sms",
        // });

        return ApiResponse.success(res, "Verification code sent successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.failure(
            res,
            "Failed to send verification code",
            500
        );
    }
});

exports.verifyPhoneNumber = asyncHandler(async (req, res, next) => {
    const { code, phoneNumber } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const client = twilio(accountSid, authToken);

    const service = client.verify.v2.services(process.env.TWILIO_SERVICE_SID);

    try {
        // const verificationCheck = await service.verificationChecks.create({
        //     to: phoneNumber,
        //     code: code,
        // });

        // if (verificationCheck.status === "approved") {
        //     req.user.isPhoneNumberVerified = true;
        //     req.user.phoneNumber = phoneNumber;
        //     await req.user.save();

        //     // // If email is also verified and the user is a pending counsellor or volunteer, send notification to admin
        //     // if (
        //     //     req.user.isEmailVerified &&
        //     //     (req.user.accountType === "pending counsellor" ||
        //     //         req.user.accountType === "pending volunteer")
        //     // ) {
        //     //     // send email to admin
        //     //     await MailNotificationService.sendEmail({
        //     //         email: process.env.ADMIN_EMAIL,
        //     //         subject: `A new ${
        //     //             req.user.accountType.split(" ")[1]
        //     //         } application has been submitted`,
        //     //         message: `Dear admin, a new ${req.user.accountType} has just verified their email and phone number. Please review their application.`,
        //     //     });
        //     //
        //     //     // confirm to user
        //     //     await MailNotificationService.sendEmail({
        //     //         email: req.user.email,
        //     //         subject: "Positiveo Support - Application Submitted",
        //     //         message:
        //     //             "Your application has been submitted. We will get back to you shortly.",
        //     //     });
        //     // }

        //     res.status(200).json({
        //         status: "success",
        //         message: "Phone number has been verified successfully",
        //     });
        // } else {
        //     return next(
        //         new AppError("Verification Code expired or invalid", 400)
        //     );
        // }

        res.status(200).json({
            status: "success",
            message: "Phone number has been verified successfully",
        });
    } catch (error) {
        AppLogger.error(error);
        return next(new AppError("Verification Code expired or invalid", 500));
    }
});

exports.getSpecificNotificationSettings = async (req, res) => {
    const id = req.user.id; // Assuming req.user contains the authenticated user's data

    try {
        // Find the user by ID and select only the required notification settings
        const user = await User.findById(id).select({
            "notificationSettings.pushConvoEngagement": 1,
            "notificationSettings.emailConvoEngagement": 1,
            "notificationSettings.pushNewConvo": 1,
            "notificationSettings.emailNewConvo": 1,
            "notificationSettings.pushRescheduleRequest": 1,
            "notificationSettings.emailRescheduleRequest": 1,
        });

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        // Return the selected notification settings
        return ApiResponse.success(
            res,
            user.notificationSettings,
            "Notification settings retrieved successfully"
        );
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.getSpecificPrivacySettings = async (req, res) => {
    const id = req.user.id; // Assuming req.user contains the authenticated user's data

    try {
        // Find the user by ID and select only the required notification settings
        const user = await User.findById(id).select({
            "privacy.showName": 1,
            "privacy.showProfilePic": 1,
            "privacy.showMoodChart": 1,
        });

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        // Return the selected notification settings
        return ApiResponse.success(
            res,
            user.privacy,
            "Privacy settings retrieved successfully"
        );
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.updatePrivacySettings = async (req, res) => {
    const { showName, showProfilePic, showMoodChart } = req.body;

    const id = req.user.id; // Assuming req.user contains the authenticated user's data

    try {
        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        // Update notification settings
        user.privacy.showName =
            showName !== undefined ? showName : user.privacy.showName;
        user.privacy.showProfilePic =
            showProfilePic !== undefined
                ? showProfilePic
                : user.privacy.showProfilePic;

        await user.save();

        return ApiResponse.success(
            res,
            user,
            "Privacy settings updated successfully"
        );
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.updateNotificationSettings = async (req, res) => {
    const {
        pushConvoEngagement,
        emailConvoEngagement,
        pushNewConvo,
        emailNewConvo,
        pushRescheduleRequest,
        emailRescheduleRequest,
        commentReplies,
    } = req.body;

    const id = req.user.id; // Assuming req.user contains the authenticated user's data

    try {
        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        // Update notification settings
        user.notificationSettings.pushConvoEngagement =
            pushConvoEngagement !== undefined
                ? pushConvoEngagement
                : user.notificationSettings.pushConvoEngagement;
        user.notificationSettings.emailConvoEngagement =
            emailConvoEngagement !== undefined
                ? emailConvoEngagement
                : user.notificationSettings.emailConvoEngagement;
        user.notificationSettings.pushNewConvo =
            pushNewConvo !== undefined
                ? pushNewConvo
                : user.notificationSettings.pushNewConvo;
        user.notificationSettings.emailNewConvo =
            emailNewConvo !== undefined
                ? emailNewConvo
                : user.notificationSettings.emailNewConvo;
        user.notificationSettings.pushRescheduleRequest =
            pushRescheduleRequest !== undefined
                ? pushRescheduleRequest
                : user.notificationSettings.pushRescheduleRequest;
        user.notificationSettings.emailRescheduleRequest =
            emailRescheduleRequest !== undefined
                ? emailRescheduleRequest
                : user.notificationSettings.emailRescheduleRequest;
        user.notificationSettings.commentReplies =
            commentReplies !== undefined
                ? commentReplies
                : user.notificationSettings.commentReplies;
        // Save the updated user document
        await user.save();

        return ApiResponse.success(
            res,
            user,
            "Notification settings updated successfully"
        );
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.UpdateProfilePicture = async (req, res) => {
    const { profilePicture } = req.body;

    const id = req.user.id;
    try {
        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        user.profilePicture.url = profilePicture;

        // Save the updated user to the database
        await user.save();

        return ApiResponse.success(res, user, "Success");
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.profileSetup = async (req, res) => {
    const {
        birthday,
        gender,
        username,
        accountPrivacy,
        turnOnNotification,
        nationality,
        interestedTopics,
        profilePicture,
    } = req.body;

    const id = req.user.id;
    try {
        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }
        // Update the user's profile information
        user.birthday = birthday || user.birthday;
        user.gender = gender || user.gender;
        user.username = username || user.username;
        user.accountPrivacy =
            accountPrivacy !== undefined ? accountPrivacy : user.accountPrivacy;
        user.turnOnNotification =
            turnOnNotification !== undefined
                ? turnOnNotification
                : user.turnOnNotification;
        user.countryOfResidence = nationality || user.countryOfResidence;
        user.interestedTopics = interestedTopics;
        user.profilePicture = profilePicture;

        // Save the updated user to the database
        await user.save();

        return ApiResponse.success(res, user, "Success");
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.UpdateGender = async (req, res) => {
    const { gender } = req.body;
    const validGenders = [
        "male",
        "female",
        "other",
        "non-binary",
        "prefer not to say",
    ]; // Enum values

    // Check if the provided gender is valid
    if (!validGenders.includes(gender)) {
        return ApiResponse.failure(
            res,
            "Invalid gender provided. Must be one of: male, female, other, non-binary, prefer not to say."
        );
    }

    const id = req.user.id;
    try {
        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }

        // Update the gender field
        user.gender = gender;

        // Save the updated user to the database
        await user.save();

        return ApiResponse.success(res, user, "Success");
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.profileSetup = async (req, res) => {
    const {
        birthday,
        gender,
        username,
        accountPrivacy,
        turnOnNotification,
        nationality,
        interestedTopics,
        profilePicture,
        city,
    } = req.body;

    const id = req.user.id;
    try {
        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }
        // Update the user's profile information
        user.birthday = birthday || user.birthday;
        user.gender = gender || user.gender;
        user.username = username || user.username;
        user.accountPrivacy =
            accountPrivacy !== undefined ? accountPrivacy : user.accountPrivacy;
        user.turnOnNotification =
            turnOnNotification !== undefined
                ? turnOnNotification
                : user.turnOnNotification;
        user.countryOfResidence = nationality || user.countryOfResidence;
        user.cityOfResidence = city || user.cityOfResidence;
        user.interestedTopics = interestedTopics;
        user.profilePicture = profilePicture;

        // Save the updated user to the database
        await user.save();

        return ApiResponse.success(res, user, "Success");
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.CounsellorProfileSetup = async (req, res) => {
    const {
        birthday,
        gender,
        username,
        accountPrivacy,
        turnOnNotification,
        nationality,
        interestedTopics,
        profilePicture,
        qualifications,
        commencePractice,
        city,
        bio,
        focusArea,
        specialty,
    } = req.body;

    const id = req.user.id;
    try {
        // Find the user by ID
        const user = await User.findById(id);
        if (!user) {
            return ApiResponse.failure(res, "User not found");
        }
        // Update the user's profile information
        user.birthday = birthday || user.birthday;
        user.gender = gender || user.gender;
        user.username = username || user.username;
        user.accountPrivacy =
            accountPrivacy !== undefined ? accountPrivacy : user.accountPrivacy;
        user.turnOnNotification =
            turnOnNotification !== undefined
                ? turnOnNotification
                : user.turnOnNotification;
        user.countryOfResidence = nationality || user.countryOfResidence;
        user.interestedTopics = interestedTopics;
        user.profilePicture = profilePicture;
        user.qualifications = qualifications;
        user.commencePractice = commencePractice;
        user.cityOfResidence = city || user.cityOfResidence;
        user.bio = bio || user.bio;
        user.focusArea = focusArea || user.focusArea;
        user.specialisedSupport = specialty || user.specialisedSupport;

        // Save the updated user to the database
        await user.save();

        return ApiResponse.success(res, user, "Awaiting verification");
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.updateCounsellorInfo = async (req, res) => {
    const transaction = await mongooseV2.startSession();
    const {
        bio,
        schedule,
        sessionType,
        specializedSupport,
        focusArea,
        commencePractice,
    } = req.body;

    const id = req.user.id;

    try {
        // Find the counselor by ID
        const counselor = await Counsellor.findById(id);
        if (!counselor) {
            return ApiResponse.failure(res, "Counselor not found");
        }
        if (!counselor.isVerified) {
            return ApiResponse.failure(
                res,
                "Counselor must be verified before proceeding"
            );
        }

        // Update the counselor's information
        counselor.bio = bio || counselor.bio;
        counselor.schedule = schedule || counselor.schedule;
        counselor.sessionType = sessionType || counselor.sessionType;
        counselor.specializedSupport =
            specializedSupport || counselor.specializedSupport;
        counselor.focusArea = focusArea || counselor.focusArea;
        counselor.commencePractice =
            commencePractice || counselor.commencePractice;

        // Save the updated counselor to the database
        transaction.startTransaction();
        await counselor.save({ session: transaction });
        await generateFreeSlotsForTwoMonths({ counselor, schedule });
        await transaction.commitTransaction();
        return ApiResponse.success(
            res,
            counselor,
            "Counselor information updated successfully"
        );
    } catch (error) {
        await transaction.abortTransaction();
        return ApiResponse.error(res, error.message);
    } finally {
        transaction.endSession();
    }
};

exports.updateCounsellorSchedule = async (req, res) => {
    const transaction = await mongooseV2.startSession();
    const { schedule } = req.body;
    const id = req.user.id;

    try {
        transaction.startTransaction();
        // Find the counselor by ID
        const counselor = await Counsellor.findOne({ _id: id });
        if (!counselor) {
            return ApiResponse.failure(res, "Counselor not found");
        }
        if (!counselor.isVerified) {
            return ApiResponse.failure(
                res,
                "Counselor must be verified before proceeding"
            );
        }

        // Update the counselor's schedule only if it is provided in the request body
        if (schedule !== undefined && schedule !== null) {
            counselor.schedule = schedule;
        }

        // Save the updated counselor to the database
        await counselor.save({ session: transaction });
        await generateFreeSlotsForTwoMonths({ counselor, schedule });

        await transaction.commitTransaction();

        return ApiResponse.success(
            res,
            counselor,
            "Counselor schedule updated successfully"
        );
    } catch (error) {
        await transaction.abortTransaction();
        return ApiResponse.error(res, error.message);
    } finally {
        transaction.endSession();
    }
};

exports.upgradeToLeaderOrReject = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { accountType, rejectionReason } = req.body;

    const leader = await User.findById(id);

    if (!leader) {
        return next(new AppError("Leader not found", 404));
    }

    if (!["pending counsellor", "pending volunteer"].includes(leader.status)) {
        return next(
            new AppError("Leader has already been approved or rejected", 400)
        );
    }

    const rejectedStatus = ["rejected counsellor", "rejected volunteer"];
    const approvedStatus = ["counsellor", "volunteer"];

    if (rejectedStatus.includes(accountType)) {
        leader.accountType = accountType;
        leader.rejectionReason = rejectionReason;
        await MailNotificationService.sendEmail({
            email: leader.email,
            subject: "Positiveo Support - Application Status",
            message: `Dear ${leader.firstName}, your application for ${accountType} has been rejected. You can open the app to see the reason. Please contact support for more information.`,
        });
    }

    if (approvedStatus.includes(accountType)) {
        leader.accountType = accountType;
        await MailNotificationService.sendEmail({
            email: leader.email,
            subject: "Positiveo Support - Application Status",
            message: `Dear ${leader.firstName}, <br> your application for ${accountType} has been approved. Please contact support for more information.`,
        });
    }

    await leader.save();

    res.status(200).json({
        status: "success",
        message: "Action successful",
        data: leader,
    });
});

exports.getCounsellorUsers = async (req, res) => {
    try {
        const { _id } = req.user;

        const counsellorUsers = await Session.find({
            status: "completed",
            counsellor: _id,
        })
            .select("user")
            .populate("user")
            .exec();

        return ApiResponse.success(res, counsellorUsers);
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.getUserCounsellors = async (req, res) => {
    try {
        const { _id } = req.user;

        const userCounsellors = await Session.find({
            status: "completed",
            user: _id,
        })
            .select("counsellor")
            .populate("counsellor")
            .exec();

        return ApiResponse.success(res, userCounsellors);
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

exports.getUserByName = async (req, res) => {
    try {
        const { firstName, lastName } = req.query;

        const user = await User.find({ firstName, lastName });

        return ApiResponse.success(res, user);
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 *
 * @description This function returns a counsellors profile including their slots and feedback received
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data A session object containing the counsellor's full details
 */
exports.getCounsellorFullProfile = async (req, res) => {
    try {
        const { counsellorId } = req.params;

        const user = await User.find({ _id: counsellorId });
        const numberOfSessions = await Session.countDocuments({
            status: "completed",
            counsellor: counsellorId,
        });
        const feedback = await Session.find({
            status: "completed",
            userRatingNotes: { $ne: null },
        }).select(["userRatingNotes", "userRating"]);

        return ApiResponse.success(res, {
            about: { schedule: { ...user.schedule }, user, numberOfSessions },
            activity: { feedback },
        });
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Retrieves a user by ID, removes the password from the user object, and sends a response.
 *
 * @function getUserById
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response with the user data if found, excluding the password.
 *
 * @throws Will send an error response if there is an issue retrieving the user.
 */
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ _id: id });

        if (!user) {
            return ApiResponse.error(res, "User not found", 404);
        }
        const sessionsCompleted = await Session.countDocuments({
            $and: [
                { status: "completed" },
                {
                    $or: [{ counsellor: id }, { user: id }],
                },
            ],
        });

        delete user.password;

        return ApiResponse.success(res, { ...user, sessionsCompleted });
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

const generateFreeSlotsForTwoMonths = async ({ counselor, schedule }) => {
    // Calculate date two months from now
    const today = new Date();
    const twoMonthsFromNow = new Date(today);
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    // Loop through each day in the next two months
    const currentDate = new Date(today);
    while (currentDate <= twoMonthsFromNow) {
        const dayOfWeek = currentDate.toLocaleString("en-GB", {
            weekday: "long",
        });

        // Find availability for the current day of the week
        const currentDayAvailability = schedule.find(
            (avail) => avail.dayOfWeek === dayOfWeek
        );
        if (!currentDayAvailability) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue; // Skip if no availability on this day
        }

        // Generate slots for each time block on the current day
        for (const block of currentDayAvailability.availability) {
            const slots = generateSlotsForTimeBlock(
                currentDate,
                block.from,
                block.to
            );

            // Save generated slots to the database
            await Slot.insertMany(
                slots.map((slot) => ({
                    counsellor: counselor._id,
                    date: currentDate,
                    startDateTime: slot.startTime,
                    endDateTime: slot.endTime,
                    status: "available",
                }))
            );
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
};

// Helper function to generate slots for a given time block
const generateSlotsForTimeBlock = (date, startTime, endTime) => {
    const slots = [];
    let currentStart = new Date(
        `${date.toISOString().split("T")[0]}T${startTime}:00`
    );
    const blockEnd = new Date(
        `${date.toISOString().split("T")[0]}T${endTime}:00`
    );

    while (currentStart < blockEnd) {
        const currentEnd = new Date(currentStart.getTime() + 15 * 60000);

        if (currentEnd <= blockEnd) {
            slots.push({
                startTime: new Date(currentStart),
                endTime: new Date(currentEnd),
            });
        }

        currentStart = new Date(currentStart.getTime() + 15 * 60000);
    }
    return slots;
};

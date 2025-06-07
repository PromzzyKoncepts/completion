const { ObjectId } = require("mongoose").Types;
const { authentication, management, deleteManagement } = require("../../configs/auth0");
const asyncHandler = require("../../middlewares/asyncHandler");
const User = require("../../models/v1/User");
const MailNotificationService = require("../../services/mailNotificationService");
const AppError = require("../../utils/appError");
const AuthUtils = require("../../utils/auth");
const AppLogger = require("../../middlewares/logger/logger");


const forgotPassword = asyncHandler(async (req, res) => {
    const data = {
        email: req.body.email,
        connection: "Username-Password-Authentication",
    };

    const message = await authentication.database.requestChangePasswordEmail(
        data
    );

    return res.status(200).json({ status: "success", message });
});

const userLogin = asyncHandler(async (req, res) => {
    const data = {
        client_id: process.env.AUTH0_CLIENTID,
        username: req.body.email,
        password: req.body.password,
        realm: "Username-Password-Authentication",
        scope: "openid profile email offline_access",
        audience: process.env.AUTH0_AUDIENCE,
    };

    const userData = await authentication.oauth.passwordGrant(data);

    return res.status(200).json({
        status: "success",
        data: userData,
    });
});

const userSignup = asyncHandler(async (req, res) => {
    const data = {
        email: req.body.email,
        password: req.body.password,
        connection: "Username-Password-Authentication",
    };

    const userData = await authentication.database.signUp(data);

    // TODO: req.body should be filtered to avoid injection
    const newUser = await User.create({ ...req.body, _id: userData._id });

    MailNotificationService.sendMail({
        recipient: newUser.email,
        templateId: "d-0e05b7f6b91541fc82d380601a7b503e",
        dynamic_template_data: {
            username: newUser.name || "New user",
            subject: "Welcome to Positiveo",
        },
    });

    return res.status(201).json({
        status: "success",
        message: "Account created successfully",
    });
});

const socialAuth = async (req, res, next) => {
    const userExists = await User.findOne({ uuid: req.userInfo.sub });

    if (userExists) {
        return res.status(200).json({
            status: "success",
            message: "You are now logged in",
        });
    }

    const data = {
        _id: ObjectId(),
        uuid: req.userInfo.sub,
        email: req?.userInfo?.email ?? "",
        name: req.userInfo.nickname,
        profilePicture: { url: req.userInfo.picture },
        socialType: AuthUtils.getSocialShort(req.userInfo.sub),
    };

    try {
        await User.create(data);
    } catch (error) {
        deleteUser(data.uuid);
        return next(new AppError(error.message, 400));
    }

    return res.status(200).json({
        status: "success",
        message: "Request successful",
    });
};

const updatePushToken = asyncHandler(async (req, res) => {
    const { pushToken } = req.body;

    await User.findOneAndUpdate({ _id: req.user.id }, { pushToken });

    return res.status(200).json({
        status: "success",
        message: "Request successful",
    });
});

const refreshToken = asyncHandler(async (req, res, next) => {
    const options = {
        refresh_token: req.body.refreshToken,
        auidence: process.env.AUTH0_AUDIENCE,
    };

    const userData = await authentication.refreshToken(options);

    return res.status(200).json({
        status: "success",
        data: userData,
    });
});

/**
 * This specifically used to delete user from Auth0
 * During registration when we fail to create user in our database
 */
const deleteUser = (id) => {
    /* eslint-disable no-console*/
    management
        .deleteUser({ id })
        // Used only for debugging
        .then((res) => console.log({ delete: res }))
        .catch((err) => console.log({ deleteError: err }));
};

const deleteAccount = asyncHandler(async (req, res) => {
    const { id: userId, sub: userIdWithAuth0 } = req.user;

    try {
        // 1. Delete user from database
        await User.findOneAndDelete({ _id: userId });

        // 2. Remove user from Auth0
        await deleteManagement.deleteUser({ id: userIdWithAuth0 });

        return res.status(200).json({
            status: "success",
            message: "Your account has been deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error deleting user",
            status: "error",
            error: error.message,
        });
    }
});

module.exports = {
    forgotPassword,
    userLogin,
    userSignup,
    socialAuth,
    refreshToken,
    updatePushToken,
    deleteAccount,
};

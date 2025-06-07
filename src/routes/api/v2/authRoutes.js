const express = require("express");
const AuthController = require("../../../controllers/v2/authController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const router = express.Router();

router.post(
    "/users/signup",
    AuthMiddleware.validateUserSignup,
    AuthController.signup
);


router.post(
    "/resend-email-verification-code",
    AuthMiddleware.protect,
    AuthController.resendEmailVerificatioCode
);

// router.post(
//     "/volunteers/signup",
//     AuthMiddleware.validateVolunteerSignup,
//     AuthController.signup
// );

// router.post(
//     "/counsellors/signup",
//     multerUploads.any(),
//     AuthMiddleware.validateCounsellorSignup,
//     fileUploader,
//     AuthMiddleware.validateFilesUpload,
//     AuthController.signup
// );

router.post("/login", AuthMiddleware.validateLogin, AuthController.login);

router.get("/google", AuthController.googleLogin);

router.get("/logout", AuthMiddleware.protect, AuthController.logout);

router.post(
    "/forgot-pwd",
    AuthMiddleware.validateForgotPassword,
    AuthController.forgotPassword
);

router.patch(
    "/reset-pwd",
    AuthMiddleware.validateResetPassword,
    AuthController.resetPassword
);

router.patch(
    "/update-pwd",
    AuthMiddleware.protect,
    AuthMiddleware.validateUpdatePassword,
    AuthController.updatePassword
);

router.post(
    "/deactivate-user",
    AuthMiddleware.protect,
    AuthController.deactivateEntity
);

router.post(
    "/activate-user",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    AuthController.activateEntity
);

router.post(
    "/delete-user",
    AuthMiddleware.protect,
    AuthController.deleteUser
);

router.get("/google/callback", AuthController.googleLoginCallback);

module.exports = router;

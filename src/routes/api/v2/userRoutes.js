const express = require("express");
const UserController = require("../../../controllers/v2/userController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const UserMiddleware = require("../../../middlewares/v2/user");
const MoodController = require("../../../controllers/v2/MoodController");
const MoodCategoryController = require("../../../controllers/v2/moodCategoryController");

const router = express.Router();

router.patch(
    "/verify-phone",
    AuthMiddleware.protect,
    UserController.verifyPhoneNumber
);

router.post(
    "/verify-phone-code",
    AuthMiddleware.protect,
    UserController.sendVerifyPhoneNumberReq
);

router.get(
    "/notification-settings",
    AuthMiddleware.protect,
    UserController.getSpecificNotificationSettings
);

router.patch(
    "/update-notification-settings",
    AuthMiddleware.protect,
    UserMiddleware.validateUpdateNotificationSettings,
    UserController.updateNotificationSettings
);

router.get(
    "/privacy-settings",
    AuthMiddleware.protect,
    UserController.getSpecificPrivacySettings
);

router.patch(
    "/update-privacy-settings",
    AuthMiddleware.protect,
    UserMiddleware.validateUpdatePrivacySettings,
    UserController.updatePrivacySettings
);

router.patch(
    "/update-gender",
    AuthMiddleware.protect,
    UserController.UpdateGender
);


router.patch(
    "/update-profile-picture",
    AuthMiddleware.protect,
    UserMiddleware.validateProfilePicture,
    UserController.UpdateProfilePicture
);

router.get(
    "/me",
    AuthMiddleware.protect,
    //AuthMiddleware.restrictTo("serviceuser"),
    UserController.getMe,
    UserController.getUser
);

router.get(
    "/get-user-locale",
    AuthMiddleware.protect,
    UserController.getUserLocaleDetails
);

router.patch(
    "/update-user-country",
    AuthMiddleware.protect,
    UserController.updateCountry
);

router
    .route("/update-user-email")
    .all(AuthMiddleware.protect)
    .patch(UserController.updateUserEmail);


router
    .route("/update_role")
    .all(AuthMiddleware.protect, AuthMiddleware.restrictTo("admin"),)
    .patch(UserController.updateUserRole)

router
    .route("/verify-user-email")
    .all(AuthMiddleware.protect)
    .post(UserController.verifyUserEmail)




router.get(
    "/username/:username",
    AuthMiddleware.protect,
    UserController.checkUsername
);

router.patch(
    "/username",
    AuthMiddleware.protect,
    UserController.updateUsername
);

router.post(
    "/feedback",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
    UserController.postFeedback
);

router.get(
    "/feedback",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("counsellor"),
    UserController.getFeedback
);
router.patch(
    "/update_name",
    AuthMiddleware.protect,
    UserController.updateName
);

router.patch(
    "/update_password",
    AuthMiddleware.protect,
    UserController.updatePassword
);

router.patch(
    "/update-admin-password",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    UserController.adminResetPassword
);


router.get(
    "/mood-categories",
    AuthMiddleware.protect,
    MoodCategoryController.getAll
);

router.post(
    "/mood-categories",
    AuthMiddleware.protect,
    MoodCategoryController.addMoodCategory
);


router.get(
    "/suggest-username",
    AuthMiddleware.protect,
    UserController.suggestUsername
);

// router
//     .route("/me")
//     .all(AuthMiddleware.protect)
//     .get(
//         AuthMiddleware.restrictTo("serviceuser"),
//         UserController.getMe,
//         UserController.getUser
//     )
//     .patch(UserMiddleware.validateUpdateMe, UserController.updateMe)
//     .delete(UserController.getMe, UserController.deleteMe);


router
    .route("/verify-email")
    .all(AuthMiddleware.protect)
    .get(UserController.sendVerifyEmailReq)
    .post(UserController.verifyEmail);

router.post(
    "/log-mood",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
    MoodController.logUserMood
);

router.get(
    "/mood-journal",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
    MoodController.getAll
);

router.get(
    "/mood-log-last-7-days",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
    MoodController.getMoodLogsForLast7Days
);  //getMoodLogsForTimeFrames

router.get(
    "/mood-log/:period",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
    MoodController.getMoodLogsForTimeFrames
);

router.patch(
    "/serviceuser/profile_setup",
    AuthMiddleware.protect,
    UserMiddleware.validateServiceUserProfileSetup,
    AuthMiddleware.restrictTo("serviceuser"),
    // uploadProfilePicture,
    UserController.profileSetup
);


router.patch(
    "/counsellor/profile_setup",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("counsellor"),
    UserMiddleware.validateCounsellorProfileSetup,
    UserController.CounsellorProfileSetup
);

router.patch(
    "/counsellor/info",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("counsellor"),
    UserMiddleware.validateCounsellorInfo,
    UserController.updateCounsellorInfo
);

router.patch(
    "/counsellor/schedule",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("counsellor"),
    UserMiddleware.validateCounsellorSch,
    UserController.updateCounsellorSchedule
);

router.get(
    "/",
    AuthMiddleware.protect,
    AuthMiddleware.hasPrivilege("admin"),
    UserController.getAll
);

router.patch(
    "/:id/upgrade",
    AuthMiddleware.protect,
    UserMiddleware.validateUpgradeToLeaderOrReject,
    AuthMiddleware.hasPrivilege("admin"),
    UserController.upgradeToLeaderOrReject
);

router.get(
    "/patients",
    AuthMiddleware.protect,
    AuthMiddleware.hasPrivilege("counsellor"),
    UserController.getCounsellorUsers
);

router.get(
    "/counsellors",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
    UserController.getUserCounsellors
);

router.get(
    "/user",
    AuthMiddleware.protect,
    UserController.getUserByName
);

router.get(
    "/counsellor/profile/:counsellorId",
    AuthMiddleware.protect,
    UserController.getCounsellorFullProfile
);

router.get(
    "/:id/user",
    AuthMiddleware.protect,
    UserController.getUserById,
);

router
    .route("/:id")
    .all(AuthMiddleware.protect, AuthMiddleware.hasPrivilege("admin"))
    .patch(UserMiddleware.validateUpdateMe, UserController.updateMe)
    .delete(UserController.deleteMe);

module.exports = router;

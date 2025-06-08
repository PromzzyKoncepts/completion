const express = require("express");
const adminontroller = require("../../../controllers/v2/adminController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const reportController = require("../../../controllers/v2/reportUserController");

const router = express.Router();

router.get(
    "/blocked-users", //unblockUser getBlockedUser
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getBlockedUsers
);

router.get(
    "/blocked-user", //unblockUser getBlockedUser
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getBlockedUser
);

router.patch(
    "/user-unblock", //unblockUser
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.unblockUser
);

router.patch(
    "/user-block", //unblockUser
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.blockUser
);

router.get(
    "/user-overview",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getUserOverview
);

router.get(
    "/town-square-overview",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getTownSquareOverview
);

router.get(
    "/user-management",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getUserManagement
);

router.get(
    "/incidents",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    reportController.getUserReports
);

module.exports = router;

const express = require("express");
const adminontroller = require("../../../controllers/v2/adminController");
const AnalyticsController = require("../../../controllers/v2/analyticsController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const reportController = require("../../../controllers/v2/reportUserController");
const MediaOverviewController = require("../../../controllers/v2/mediaOverviewController");
const MediaController = require("../../../controllers/v2/mediaController");
const ArticleController = require("../../../controllers/v2/adminArticleController");
const ArticleMiddleware = require("../../../middlewares/v2/article");

const router = express.Router();
// for overviews
router.get(
    "/media-overview",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    MediaOverviewController.getWeeklyMediaTrends
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

// for users

router.get(
    "/incidents",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    reportController.getUserReports
);

router.patch(
    "/user-unblock", //unblockUser
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.unblockUser
);

router.patch(
    "/user-block", //blockUser
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.blockUser
);

router.get(
    "/blocked-users",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getBlockedUsers
);

router.get(
    "/blocked-user",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getBlockedUser
);


// ARTICLE FOR ADMIN ONLY
router.post(
    "/article/create",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    ArticleMiddleware.validateCreateAdminArticle,
    ArticleController.createArticle
);

// counsellor verification
router.get(
    "/counsellors/all",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getAllCounsellors
);

router.patch(
    "/counsellor/verify",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.verifyCounsellor
);

// for media routes

router.post(
  "/featured/:mediaId",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("admin"),
  MediaController.addToFeatured
);

router.delete(
  "/featured/:mediaId",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("admin"),
  MediaController.removeFromFeatured
);

router.patch(
  "/featured/:mediaId/order",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("admin"),
  MediaController.updateFeaturedOrder
);

router.get(
  "/featured",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("admin"),
  MediaController.getFeaturedMedia
);


// ANALYTICS CONTROLLER FOR REPORTS

router.get(
    "/signups",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    AnalyticsController.getSignupAnalytics
);

router.get(
    "/media-engagements",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    AnalyticsController.getMediaEngagementAnalytics
);

router.get(
    "/sessions",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    AnalyticsController.getSessionAnalytics
);


module.exports = router;
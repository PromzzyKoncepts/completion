const express = require("express");
const adminontroller = require("../../../controllers/v2/adminController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const reportController = require("../../../controllers/v2/reportUserController");

const router = express.Router();

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
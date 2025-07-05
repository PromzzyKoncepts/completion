const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const ReportUserController = require("../../../controllers/v2/reportUserController");
const ReportUserMiddleware = require("../../../middlewares/v2/reportUser");

const router = express.Router();

router.post(
    "/",
    AuthMiddleware.protect,
    // AuthMiddleware.restrictTo("serviceuser", "counsellor"),
    // ReportUserMiddleware.validateReportUser,
    ReportUserController.reportUser
);

router.get("/", AuthMiddleware.protect, ReportUserController.getReport);

router.get(
    "/all",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    ReportUserController.getUserReports
);

// getUserReports

module.exports = router;

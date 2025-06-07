
const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");

const breathingSessionController = require("./../../../controllers/v2/breathingSessionController") 

const router = express.Router();


router.post(
    "/create",
     AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
     breathingSessionController.logBreathingSession
    );
router.get(
    "/summary",
     AuthMiddleware.protect,
    AuthMiddleware.restrictTo("serviceuser"),
     breathingSessionController.BreathingSessionSummary
    );

    module.exports = router;
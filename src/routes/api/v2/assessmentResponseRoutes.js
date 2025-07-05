const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const AssessmentResponseController = require("../../../controllers/v2/assessmentResponseController");
const AssessmentResponseMiddleware = require("../../../middlewares/v2/assessmentResponse");

const router = express.Router();

router.post(
  "/",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser"),
  AssessmentResponseMiddleware.validateAssessmentResponse,
  AssessmentResponseController.submitResponse
);

router.get(
  "/:id",
  AuthMiddleware.protect,
  AssessmentResponseController.getResponse
);

router.get(
  "/:userId",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor", "admin"),
  AssessmentResponseController.getPatientResponsesForCounsellor
)

router.get(
  "/:userId/:assessmentId",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor", "admin"),
  AssessmentResponseController.getUserResponseForAssessment
)

router.delete(
  "/:id",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor", "admin"),
  AssessmentResponseController.deleteResponse
)

module.exports = router;

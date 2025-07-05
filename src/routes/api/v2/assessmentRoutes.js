const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const AssessmentController = require("../../../controllers/v2/assessmentController");
const AssessmentMiddleware = require("../../../middlewares/v2/assessment");

const router = express.Router();

router.post(
  "/",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor"),
  AssessmentMiddleware.validateCreateAssessment,
  AssessmentController.createAssessment,
);

router.get(
  "/:id",
  AuthMiddleware.protect,
  AssessmentController.getAssessment
);

router.delete(
  "/:id",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "admin"),
  AssessmentController.deleteAssessment
)

module.exports = router;

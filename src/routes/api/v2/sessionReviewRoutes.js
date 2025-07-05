const express = require("express");
const SessionReviewController = require("../../../controllers/v2/sessionReviewController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const ReviewMiddleware = require("../../../middlewares/v2/sessionReview");

const router = express.Router({ mergeParams: true });

router
    .route("/")
    .all(AuthMiddleware.protect)
    .get(SessionReviewController.getAllReviews)
    .post(
        ReviewMiddleware.validateCreateReview,
        SessionReviewController.createReview
    );

router
    .route("/:id")
    .all(AuthMiddleware.protect)
    .get(SessionReviewController.getReview)
    .patch(
        ReviewMiddleware.validateUpdateReview,
        SessionReviewController.updateReview
    )
    .delete(SessionReviewController.deleteReview);

module.exports = router;

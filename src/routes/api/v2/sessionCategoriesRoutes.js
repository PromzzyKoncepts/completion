const express = require("express");
const SessionCategoriesController = require("../../../controllers/v2/sessionCategoriesController");
const AuthMiddleware = require("../../../middlewares/v2/auth");

const router = express.Router({ mergeParams: true });

router
    .route("/")
    .get(SessionCategoriesController.getAllSessionCategories)
    .post(
        AuthMiddleware.protect,
        AuthMiddleware.restrictTo("admin"),
        SessionCategoriesController.createSessionCategory
    );

router
    .route("/:id")
    .get(SessionCategoriesController.getSessionCategory)
    .patch(
        AuthMiddleware.protect,
        AuthMiddleware.restrictTo("admin"),
        SessionCategoriesController.updateSessionCategory
    )
    .delete(
        AuthMiddleware.protect,
        AuthMiddleware.restrictTo("admin"),
        SessionCategoriesController.deleteSessionCategory
    );

module.exports = router;

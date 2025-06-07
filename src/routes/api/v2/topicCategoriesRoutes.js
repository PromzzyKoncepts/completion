
const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const TopicCategoryController = require("./../../../controllers/v2/topicCategoriesController");
const router = express.Router({ mergeParams: true });

router.post(
    "/add",
    AuthMiddleware.protect,
   // AuthMiddleware.hasPrivilege("admin"),
    TopicCategoryController.addTopicCategory
);
router.get(
    "/",
    AuthMiddleware.protect,
    TopicCategoryController.getAllTopicCategories
);

module.exports = router;

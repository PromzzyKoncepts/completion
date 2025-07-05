const express = require("express");
const {
    TopicCategoriesController,
} = require("../../../controllers/v1/topicCategoriesController");

const router = express.Router();

router.route("/").get(TopicCategoriesController.getCategories);

module.exports = router;

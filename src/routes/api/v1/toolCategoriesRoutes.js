const express = require("express");
const {
    ToolCategoriesController,
} = require("../../../controllers/v1/toolCategoriesController");

const router = express.Router();

router.route("/").get(ToolCategoriesController.fetchToolCategories);

module.exports = router;

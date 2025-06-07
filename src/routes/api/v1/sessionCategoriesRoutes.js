const express = require("express");
const {
    SessionCategoriesController,
} = require("../../../controllers/v1/sessionCategoriesController");

const router = express();

router.get("/", SessionCategoriesController.getSessionCategories);

module.exports = router;

const express = require("express");
const { ToolController } = require("../../../controllers/v1/toolController");
const Auth0Middleware = require("../../../middlewares/v1/auth0");

const router = express.Router();

router.use(Auth0Middleware.checkJwt);
router.use(Auth0Middleware.appendUserId);

router.post("/", ToolController.addTool);
router.post("/", ToolController.addTool);

router.get("/:code", ToolController.fetchTools);

module.exports = router;

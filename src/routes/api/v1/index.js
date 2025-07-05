const express = require("express");
const userRoutes = require("./userRoutes");
const profileRoutes = require("./profileRoutes");
const topicRoutes = require("./topicRoutes");
const topicCategoriesRoutes = require("./topicCategoriesRoutes");
const sessionCategoriesRoutes = require("./sessionCategoriesRoutes");
const toolCategoriesRoutes = require("./toolCategoriesRoutes");
const sessionRoutes = require("./sessionRoutes");
const toolRoutes = require("./toolRoutes");
const adminRoutes = require("./adminRoutes");
const swaggerOptions = require("../../../configs/swagger/swaggerDefinition");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const router = express.Router();

router.use("/auth", userRoutes);
router.use("/profile", profileRoutes);
router.use("/topic", topicRoutes);
router.use("/categories", topicCategoriesRoutes);
router.use("/session-categories", sessionCategoriesRoutes);
router.use("/tool-categories", toolCategoriesRoutes);
router.use("/sessions", sessionRoutes);
router.use("/tool", toolRoutes);
router.use("/admin", adminRoutes);

const specs = swaggerJSDoc(swaggerOptions);
router.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

module.exports = router;

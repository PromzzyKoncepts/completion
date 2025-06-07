const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const slotRoutes = require("./slotRoutes");
const sessionRoutes = require("./sessionRoutes");
const toolRoutes = require("./toolRoutes");
const intakeQuestionnaireRoutes = require("./intakeQuestionnaireRoutes");
const intakeResponseRoutes = require("./intakeResponseRoutes");
const topicCategoryRoutes = require("./topicCategoriesRoutes");
const thoughtOfTheDay = require("./thoughtOfTheDayRoutes");
const breathingSession = require("./breathingSessionRoutes");
const reportUserRoutes = require("./reportUserRoutes");
const assessmentRoutes = require("./assessmentRoutes");
const assessmentResponseRoutes = require("./assessmentResponseRoutes");
const TownSquareRoutes = require("./townSquareRoutes");
const chatRequestRoutes = require("./chatRequestRoutes")
const topicRoutes = require("./topicRoutes");
const adminRoutes = require("./adminRoutes");
const router = express.Router();

router.use("/thought-of-the-day", thoughtOfTheDay);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/sessions", sessionRoutes);
router.use("/slots", slotRoutes);
router.use("/tools", toolRoutes);
router.use("/intake-questionnaires", intakeQuestionnaireRoutes);
router.use("/intake-responses", intakeResponseRoutes);
router.use("/topic-categories", topicCategoryRoutes);
router.use("/breathing-session", breathingSession);
router.use("/report-user", reportUserRoutes);
router.use("/assessment", assessmentRoutes);
router.use("/assessment-response", assessmentResponseRoutes);
router.use("/square", TownSquareRoutes)
router.use("/chat-request", chatRequestRoutes);

router.use("/topic", topicRoutes);
router.use("/admin", adminRoutes);

module.exports = router;

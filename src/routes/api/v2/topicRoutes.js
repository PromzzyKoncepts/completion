const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const TopicController = require("./../../../controllers/v2/topicController");
const router = express.Router();

router.post(
    "/add",
    AuthMiddleware.protect,
    TopicController.addTopic,
);

router.get(
    "/",
    AuthMiddleware.protect,
    TopicController.getTopics
);

router.post(
    "/:id/mute",
    AuthMiddleware.protect,
    TopicController.muteTopic
);

router.post(
    "/:id/leave",
    AuthMiddleware.protect,
    TopicController.leaveTopic
);

router.post(
    "/:id/join",
    AuthMiddleware.protect,
    TopicController.joinTopic
);

module.exports = router;
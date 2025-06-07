const express = require("express");
const { TopicController } = require("../../../controllers/v1/topicController");
const multer = require("multer");
const {
    validateTopic,
    validateComment,
    validateCommentReply,
} = require("../../../middlewares/v1/validatetopic");

const Auth0Middleware = require("../../../middlewares/v1/auth0");


const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.use(Auth0Middleware.checkJwt);
router.use(Auth0Middleware.appendUserId);

router.get("/", TopicController.fetchTopics);

router.get("/comments/:topicId", TopicController.fetchComments);

router.post(
    "/add-topic",
    upload.array("images", 4),
    validateTopic,
    TopicController.createTopic
);

router.post("/add-comment/:topic", validateComment, TopicController.addComment);

router.post(
    "/add-comment-reply/:topic/:comment",
    validateCommentReply,
    TopicController.addCommentReply
);

router.put("/pin-topic", TopicController.pinTopic);

router.put("/unpin-topic", TopicController.unpinTopic);

router.put("/like", TopicController.likeTopic);

router.put("/unlike", TopicController.unlikeTopic);

router.put("/comment/like", TopicController.likeComment);

router.put("/comment/unlike", TopicController.unlikeComment);

router.put("/comment-reply/like", TopicController.likeCommentReply);

router.put("/comment-reply/unlike", TopicController.unlikeCommentReply);

router.put("/leave-conversation/:topic", TopicController.leaveConversation);

router.put("/join-conversation/:topic", TopicController.joinConversation);

module.exports = router;

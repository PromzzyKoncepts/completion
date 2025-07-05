const express = require("express");
const TownSquareController = require("../../../controllers/v2/townSquareController");
const MediaController = require("../../../controllers/v2/mediaController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const TownSquareMiddleware = require("../../../middlewares/v2/townSquare");
const { upload } = require("../../../middlewares/media");

const router = express.Router();

const TopicIcons = upload.fields([
  { name: "image", maxCount: 1 },
  { name: /tips\[\d+\]\[icon\]/, maxCount: 1 }
]);
router.post(
  "/topic",
  TopicIcons,
  TownSquareMiddleware.validateAddTopic,
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("admin"),
  TownSquareController.addTopic,
);

router.patch(
  "/topic/:id",
  upload.single("image"),
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("admin"),
  TownSquareController.updateTopic
  
)

router.get(
  "/topic",
  AuthMiddleware.protect,
  TownSquareController.getTopics
);

router.get(
  "/topic/:topicId",
  AuthMiddleware.protect,
  TownSquareController.getTopicDetails,
)


router.patch(
  "/topic/:id/mute",
  AuthMiddleware.protect,
  TownSquareController.muteTopic
);

router.patch(
  "/topic/:id/leave",
  AuthMiddleware.protect,
  TownSquareController.leaveTopic
);

router.patch(
  "/topic/:id/join",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  TownSquareController.joinTopic
);

router.post(
  "/convo/:topicId",
  // TownSquareMiddleware.validateAddConvo,
  AuthMiddleware.protect,
  TownSquareController.createConvo
);

router.patch(
  "/convo/:id/join",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  TownSquareController.joinConvo
);

router.get(
  "/convo/me",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  TownSquareController.getUserConvos,
)

router.patch(
  "/convo/:id/leave",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  TownSquareController.leaveConvo
);

router.post(
  "/convo/:id/report",
  AuthMiddleware.protect,
  // AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  TownSquareController.reportConvo
);

router.post(
  "/convo/:id/reaction",
  TownSquareMiddleware.validateConvoReaction,
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  TownSquareController.addReaction
);

router.get(
  "/convo",
  AuthMiddleware.protect,
  TownSquareController.getConvos
);

router.post(
  "/convo/:id/comment",
  TownSquareMiddleware.validateCommentOnConvo,
  AuthMiddleware.protect,
  TownSquareController.addComment
);

router.post(
  "/convo/comment/:id/reply",
  AuthMiddleware.protect,
  TownSquareController.addReplyComment
);

router.get(
  "/convo/:id/comment",
  AuthMiddleware.protect,
  TownSquareController.getComments
);

router.post(
  "/convo/comment/:id/like",
  AuthMiddleware.protect,
  TownSquareController.likeComment
);

// MEDIA ROUTES

router.post(
  "/media/:topicId",
  TownSquareMiddleware.validateCreateMedia,
  AuthMiddleware.protect,
  // AuthMiddleware.restrictTo("admin"),
  MediaController.createMedia
);


router.get(
  "/media",
  AuthMiddleware.protect,
  MediaController.getMedia
);

router.post(
  "/media/:id/report",
  AuthMiddleware.protect,
  MediaController.reportMedia
);

router.post(
  "/media/:id/favorite",
  AuthMiddleware.protect,
  MediaController.addMediaToFavorites
);

router.post(
  "/media/:id/like",
  AuthMiddleware.protect,
  MediaController.likeMedia
);

router.post(
  "/media/:id/comment",
  AuthMiddleware.protect,
  MediaController.addComment,
);

router.post(
  "/media/:mediaId/comment/:commentId/like",
  AuthMiddleware.protect,
  MediaController.likeComment,
);

router.post(
  "/media/:mediaId/comment/:commentId/reply",
  AuthMiddleware.protect,
  MediaController.replyToComment,
);


module.exports = router;

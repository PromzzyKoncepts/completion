const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const ChatRequestMiddleware = require("../../../middlewares/v2/chatRequest");
const ChatRequestController = require("../../../controllers/v2/chatRequestController")

const router = express.Router();

router.post(
  "/",
  ChatRequestMiddleware.validateChatRequest,
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser"),
  ChatRequestController.createChatRequest
)

router.get(
  "/",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor"),
  ChatRequestController.findChatRequests
)

router.patch(
  "/accept/:id",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor"),
  ChatRequestController.acceptChatRequest
)

module.exports = router;

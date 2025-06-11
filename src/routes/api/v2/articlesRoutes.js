const express = require("express");
const ArticleController = require("../../../controllers/v2/articleController");

const AuthMiddleware = require("../../../middlewares/v2/auth");
const ArticleMiddleware = require("../../../middlewares/v2/article");
const CommentMiddleware = require("../../../middlewares/v2/comment");

/**
 * Express router for handling article-related routes and actions.
 * Utilizes the articleControllerInstance to delegate the functionality.
 *
 * @param {SocketIO.Socket} townSquareSocket - The Socket.IO instance used for real-time communication. It is needed to instantiate the articleControllerInstance.
 * @returns {express.Router} - An instance of the Express router for article routes.
 */
module.exports = (townSquareSocket) => {
    const router = express.Router();
    const articleControllerInstance = ArticleController(townSquareSocket);
    
    
    // router.put("/:id/click", articleController.clickArticle);
    router.patch(
        "/:id/click",
        AuthMiddleware.protect,
        ArticleController.clickArticle
    );

    router.post(
        "/",
        AuthMiddleware.protect,
        ArticleMiddleware.validateCreateArticle,
        articleControllerInstance.createArticle
    );
    
    router.get(
        "/",
        AuthMiddleware.protect,
        articleControllerInstance.getArtciles
    );
    router.get(
        "/:id",
        AuthMiddleware.protect,
        articleControllerInstance.getArticle
    );
    router.patch(
        "/:id",
        AuthMiddleware.protect,
        ArticleMiddleware.validateUpdateArticle,
        articleControllerInstance.updateArticle
    );
    router.delete(
        "/:id",
        AuthMiddleware.protect,
        // admin or owner
        articleControllerInstance.deleteArticle
    );
    router.post(
        "/:id/like",
        AuthMiddleware.protect,
        ArticleMiddleware.validateLikeArticle,
        articleControllerInstance.likeArticle
    );

    router.post(
        "/:id/comments",
        AuthMiddleware.protect,
        CommentMiddleware.validateCommentOrReplyArticle,
        articleControllerInstance.commentArticle
    );

    router.post(
        "/:id/comments/:commentId",
        AuthMiddleware.protect,
        CommentMiddleware.validateCommentOrReplyArticle,
        articleControllerInstance.replyComment
    );
    router.post(
        "/:id/comments/:commentId/like",
        AuthMiddleware.protect,
        CommentMiddleware.validateLikeComment,
        articleControllerInstance.likeComment
    );
    router.delete(
        "/:id/comments/:commentId",
        AuthMiddleware.protect,
        articleControllerInstance.getCommentId,
        articleControllerInstance.deleteComment
    );
    router.patch(
        "/:id/comments/:commentId",
        AuthMiddleware.protect,
        CommentMiddleware.validateUpdateComment,
        articleControllerInstance.updateComment
    );
    // get comments
    router.get(
        "/:id/comments",
        AuthMiddleware.protect,
        articleControllerInstance.getComments
    );
    router.get(
        "/:id/comments/:commentId",
        AuthMiddleware.protect,
        articleControllerInstance.getCommentId,
        articleControllerInstance.getComment
    );

    return router;
};

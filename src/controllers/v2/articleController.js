const AppLogger = require("../../middlewares/logger/logger");
const asyncHandler = require("../../middlewares/asyncHandler");
const Article = require("../../models/v2/Article");
const Factory = require("../../utils/factory");
const AppError = require("../../utils/appError");
const Comment = require("../../models/v2/Comment");

/**
 * Creates and returns a controller object with various API endpoint handlers.
 *
 * Socket.io event handling and controller functions for interacting with articles, comments, and likes.
 * Utilizes the Factory pattern for consistent CRUD operations.
 *
 * This architecture avoids circular dependencies between the socket.io instance and the controller functions.
 *
 * @param {SocketIO.Socket} townSquareSocket - The Socket.IO instance used for real-time communication.
 * @returns {Object} - An object containing various controller functions for articles, comments, and likes.
 */



module.exports = (townSquareSocket) => {
    townSquareSocket.on("connection", (socket) => {
        AppLogger.info("A user connected to town square");
        socket.on("disconnect", () => {
            AppLogger.info("A user disconnected from town square");
        });
    });

    return {
        createArticle: asyncHandler(async (req, res, next) => {
            const article = await Article.create(req.body);

            res.status(201).json({
                status: "success",
                data: article,
            });
        }),

        getArtciles: Factory.getAll(Article),
        getArticle: Factory.get(Article),
        updateArticle: asyncHandler(async (req, res, next) => {
            const article = await Article.findByIdAndUpdate(
                req.params.id,
                {
                    ...req.body,
                    edited: true,
                    lastEditedAt: Date.now(),
                },
                { new: true }
            );

            if (!article) {
                return next(new AppError("Article not found", 404));
            }

            townSquareSocket.emit("articleEdit", article);

            res.status(200).json({
                status: "success",
                data: {
                    article,
                },
            });
        }),

        deleteArticle: Factory.delete(Article),
        likeArticle: asyncHandler(async (req, res, next) => {
            const data = req.body;

            const article = await Article.findByIdAndUpdate(
                data.id,
                {
                    $inc: { likeCount: data.value },
                    [data.value > 0 ? "$push" : "$pull"]: {
                        likes: data.userId,
                    },
                },
                { new: true }
            );

            townSquareSocket.emit("articleLike", article);

            res.status(200).json({
                status: "success",
                data: {
                    article,
                },
            });
        }),
        commentArticle: asyncHandler(async (req, res, next) => {
            const data = req.body;
            let article = await Article.findById(req.params.id);

            if (!article) {
                return next(new AppError("Article not found", 404));
            }

            const comment = await Comment.create({
                content: data.comment,
            });

            article = await article.updateOne({
                $push: { comments: comment._id },
                $inc: { commentCount: 1 },
            });

            townSquareSocket.emit("newComment", { article, comment });

            res.status(201).json({
                status: "success",
                data: {
                    article,
                    comment,
                },
            });
        }),

        replyComment: asyncHandler(async (req, res, next) => {
            const articleId = req.params.id;
            const parentId = req.params.commentId;

            const article = await Article.findById(articleId);

            if (!article) {
                return next(new AppError("Article not found", 404));
            }

            let parentComment = await Comment.findById(parentId);

            if (!parentComment) {
                return next(new AppError("Parent comment not found", 404));
            }

            const newReply = await Comment.create({
                ...req.body,
            });

            parentComment = await parentComment.updateOne({
                $push: { replies: newReply._id },
                $inc: { repliesCount: 1 },
            });

            townSquareSocket.emit("newReply", { article, parentComment });

            res.status(201).json({
                status: "success",
                data: {
                    article,
                    parentComment,
                    newReply,
                },
            });
        }),

        updateComment: asyncHandler(async (req, res, next) => {
            const articleId = req.params.id;
            const commentId = req.params.commentId;
            const { content } = req.body;

            const article = await Article.findById(articleId);

            if (!article) {
                return next(new AppError("Article not found", 404));
            }

            const comment = Comment.findByIdAndUpdate(
                commentId,
                {
                    content,
                    edited: true,
                    lastEditedAt: Date.now(),
                },
                { new: true }
            );

            townSquareSocket.emit("updateComment", { article, comment });

            res.status(201).json({
                status: "success",
                data: {
                    comment,
                },
            });
        }),

        likeComment: asyncHandler(async (req, res, next) => {
            const { value, userId } = req.body;

            const article = await Article.findById(req.params.id);

            if (!article) {
                return next(new AppError("Article not found", 404));
            }

            const comment = await Comment.findById(req.params.commentId);

            if (!comment) {
                return next(new AppError("Comment not found", 404));
            }

            comment.likeCount += value;
            comment.likes.push(userId);
            await comment.save();

            townSquareSocket.emit("like comment", { article, comment });

            res.status(200).json({
                status: "success",
                data: {
                    comment,
                },
            });
        }),

        /**
         * Middleware to retrieve the comment id from the request params.
         */
        getCommentId: (req, res, next) => {
            req.params.id = req.params.commentId;
            next();
        },
        getComment: Factory.get(Comment),
        getComments: Factory.getAll(Comment),
        deleteComment: Factory.delete(Comment),
    };
};

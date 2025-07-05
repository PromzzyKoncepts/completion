const asyncHandler = require("../../middlewares/asyncHandler");
const AppError = require("../../utils/appError");
const Media = require("../../models/v2/AdminArticle");
const Article = require("../../models/v2/Article");
const Topic = require("../../models/v2/Topic");
const ApiResponse = require("../../utils/ApiResponse");
const AppLogger = require("../../middlewares/logger/logger");

exports.createArticle = asyncHandler(async (req, res, next) => {
    try {
        const author = req.user.id;
        const { title, topicId, contentBlocks, featuredImage } = req.body;

        // Validate required fields
        // if (!title || !topicId) {
        //     return ApiResponse.error(res, "Title and topic are required", 400);
        // }

        // Check if topic exists
        const existingTopic = await Topic.findById(topicId);
        if (!existingTopic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        // Validate content blocks if provided
        if (contentBlocks && Array.isArray(contentBlocks)) {
            for (const block of contentBlocks) {
                if (!block.type || !["text", "image"].includes(block.type)) {
                    return ApiResponse.error(
                        res,
                        "Each content block must have a valid type (text or image)",
                        400
                    );
                }
                if (!block.content) {
                    return ApiResponse.error(
                        res,
                        "Each content block must have content",
                        400
                    );
                }
                if (typeof block.order !== "number") {
                    return ApiResponse.error(
                        res,
                        "Each content block must have an order number",
                        400
                    );
                }
            }
        }else{
            return ApiResponse.error(
                res,
                "Content blocks cannot be empty",
                400
            );
        }

        // Create a new article
        const newArticle = new Media({
            title,
            type: "article",
            topic: topicId,
            author,
            contentBlocks: contentBlocks,
            featuredImage: featuredImage,
        });

        // Save the article
        await newArticle.save();

        // Return success response with the created article
        return ApiResponse.success(
            res,
            newArticle,
            "Article created successfully",
            201
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error creating article");
    }
});

exports.getArticleById = asyncHandler(async (req, res, next) => {
    try {
        const articleId = req.params.id;

        const article = await Media.findById(articleId)
            .populate("topic", "title")
            .populate("author", "firstName lastName profilePicture")
            .populate("comments.author", "firstName lastName profilePicture");

        if (!article || article.type !== "article") {
            return ApiResponse.error(res, "Article not found", 404);
        }

        return ApiResponse.success(
            res,
            article,
            "Article fetched successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error fetching article");
    }
});

exports.updateArticle = asyncHandler(async (req, res, next) => {
    try {
        const author = req.user.id;
        const articleId = req.params.id;
        const { title, contentBlocks, featuredImage } = req.body;

        // Find the article
        const article = await Media.findById(articleId);

        if (!article || article.type !== "article") {
            return ApiResponse.error(res, "Article not found", 404);
        }

        // Check if the user is the author
        if (article.author.toString() !== author) {
            return ApiResponse.error(
                res,
                "You are not authorized to update this article",
                403
            );
        }

        // Update fields if provided
        if (title) article.title = title;
        if (featuredImage) article.featuredImage = featuredImage;

        // Update content blocks if provided
        if (contentBlocks && Array.isArray(contentBlocks)) {
            // Validate content blocks
            for (const block of contentBlocks) {
                if (!block.type || !["text", "image"].includes(block.type)) {
                    return ApiResponse.error(
                        res,
                        "Each content block must have a valid type (text or image)",
                        400
                    );
                }
                if (!block.content) {
                    return ApiResponse.error(
                        res,
                        "Each content block must have content",
                        400
                    );
                }
                if (typeof block.order !== "number") {
                    return ApiResponse.error(
                        res,
                        "Each content block must have an order number",
                        400
                    );
                }
            }
            article.contentBlocks = contentBlocks;
        }

        // Save the updated article
        await article.save();

        return ApiResponse.success(
            res,
            article,
            "Article updated successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error updating article");
    }
});

exports.deleteArticle = asyncHandler(async (req, res, next) => {
    try {
        const author = req.user.id;
        const articleId = req.params.id;

        // Find the article
        const article = await Media.findById(articleId);

        if (!article || article.type !== "article") {
            return ApiResponse.error(res, "Article not found", 404);
        }

        // Check if the user is the author
        if (article.author.toString() !== author) {
            return ApiResponse.error(
                res,
                "You are not authorized to delete this article",
                403
            );
        }

        // Delete the article
        await article.remove();

        return ApiResponse.success(res, null, "Article deleted successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error deleting article");
    }
});

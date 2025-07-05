const asyncHandler = require("../../middlewares/asyncHandler");
const AppError = require("../../utils/appError");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const MailNotificationService = require("../../services/mailNotificationService");
const User = require("../../models/v2/Base");
const Feedback = require("../../models/v2/UserFeedback");
const Topic = require("../../models/v2/Topic");
const TopicCategory = require("../../models/v2/TopicCategories");
const AppLogger = require("../../middlewares/logger/logger");
const Factory = require("../../utils/factory");
const ApiResponse = require("../../utils/ApiResponse");
//

exports.getTopics = asyncHandler(async (req, res, next) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;

        let query = {};
        if (category) {
            query.category = category;
        }

        // Fetch topics with pagination and populate category and author
        const topics = await Topic.find(query)
            .populate("category", "name")  // Populate category name
            .populate("author", "firstName lastName")  // Populate author name
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean({ virtuals: true });

        // Count total topics
        const totalTopics = await Topic.countDocuments(query);

        // Return success response with topics and pagination info
        return ApiResponse.success(res, {
            topics,
            pagination: {
                totalTopics,
                currentPage: page,
                totalPages: Math.ceil(totalTopics / limit),
            },
        }, "Topics fetched successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error fetching topics");
    }
});

exports.addTopic = asyncHandler(async (req, res, next) => {
    try {
        const { title, description, image, category } = req.body;

        // Validate input: Ensure required fields are provided
        if (!title || !category) {
            return ApiResponse.failure(res, "Title and category are required");
        }

        // Validate if the category exists
        const topicCategory = await TopicCategory.findById(category);
        if (!topicCategory) {
            return ApiResponse.failure(res, "Invalid category");
        }

        // Create a new Topic document
        const newTopic = new Topic({
            title,
            description,
            image: {
                url: image?.url || "",  // Optional image field
                reference: image?.reference || "",
            },
            category,
            author: req.user.id,
            likes: [],
            commentCount: 0,  // Initialize with 0 comments
            createdAt: new Date(),
            lastUpdated: new Date(),
        });

        // Save the new topic to the database
        await newTopic.save();

        return ApiResponse.success(res, newTopic, "Topic added successfully");

    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error adding topic");
    }
});

exports.muteTopic = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const topic = await Topic.findById(id);
        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        if (topic.muted.includes(userId)) {
            return ApiResponse.error(res, "You have already muted this topic", 400);
        }

        topic.muted.push(userId);
        var save = await topic.save();

        return ApiResponse.success(res, null, "Topic muted successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error muting topic");
    }
});


exports.leaveTopic = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const topic = await Topic.findById(id);
        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        const userIndex = topic.participants.indexOf(userId);
        if (userIndex === -1) {
            return ApiResponse.error(res, "You are not a member of this topic", 400);
        }

        topic.participants.splice(userIndex, 1);
        await topic.save();

        return ApiResponse.success(res, null, "You have left the topic successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error leaving topic");
    }
});

exports.joinTopic = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const topic = await Topic.findById(id);
        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        if (topic.participants.includes(userId)) {
            return ApiResponse.error(res, "You are already a member of this topic", 400);
        }

        topic.participants.push(userId);
        await topic.save();

        return ApiResponse.success(res, null, "You have joined the topic successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error joining topic");
    }
});
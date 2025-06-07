const asyncHandler = require("../../middlewares/asyncHandler");
const TopicCategory = require("../../models/v2/TopicCategories")
const ApiResponse = require("../../utils/ApiResponse");
const AppLogger = require("../../middlewares/logger/logger");


exports.addTopicCategory = asyncHandler(async (req, res, next) => {
    try {
        const { name, description, code, color_code, rank } = req.body; // Assume these fields are passed in the request body

        // Validate input: Ensure all required fields are provided
        if (!name || !code) {
            return ApiResponse.failure(res, "Name and code are required");
        }

        // Create a new TopicCategory document
        const newTopicCategory = new TopicCategory({
            name,
            description,
            code,
            color_code,
            created_on: new Date().toISOString(), // Set the created date
            topic_count: 0, // Initialize topic count as 0
            created_by: req.user.id, // Assume `req.user.id` contains the ID of the user creating the category
            rank: rank || 0, // Optional: Use provided rank or default to 0
        });

        // Save the new topic category to the database
        await newTopicCategory.save();

        return ApiResponse.success(res, newTopicCategory, "Topic category added successfully");

    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error adding topic category");
    }
});


exports.getAllTopicCategories = asyncHandler(async (req, res, next) => {
    try {
        // Get all topic categories sorted by name in descending order (Z-A)
        const topicCategories = await TopicCategory.find({})
            .sort({ name: -1 }) // -1 for descending order
            .select("name description code color_code rank") // Only select these fields
            .lean(); // Convert to plain JavaScript objects

        // Format the response data as specified
        const formattedCategories = topicCategories.map(category => ({
            name: category.name,
            description: category.description,
            code: category.code,
            color_code: category.color_code,
            rank: category.rank,
            id:category._id
        }));

        return ApiResponse.success(res, formattedCategories, "Topic categories retrieved successfully");

    } catch (error) {
        AppLogger.error(error);
        console.log(error)
        return ApiResponse.error(res, "Error retrieving topic categories");
    }
});
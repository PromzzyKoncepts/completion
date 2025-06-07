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

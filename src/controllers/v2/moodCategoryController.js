const asyncHandler = require("../../middlewares/asyncHandler");
const AppLogger = require("../../middlewares/logger/logger");
const Factory = require("../../utils/factory");
const MoodCategory = require("../../models/v2/MoodCategory");
const ApiResponse = require("../../utils/ApiResponse");
const { PushNotification } = require("../../services/pushNotifications");

exports.getAll = Factory.getAll(MoodCategory);

exports.addMoodCategory = asyncHandler(async (req, res, next) => {
    const { category, emotions } = req.body;

    // Validate inputs
    if (!category || !Array.isArray(emotions) || emotions.length === 0) {
        return ApiResponse.failure(res, "Category and emotions are required.");
    }

    // Check if the mood category already exists
    const existingCategory = await MoodCategory.findOne({ category });
    if (existingCategory) {
        return ApiResponse.failure(res, "Mood category already exists.");
    }

    // Create a new MoodCategory document
    const newMoodCategory = new MoodCategory({
        category,
        emotions
    });

    // Save the new category
    await newMoodCategory.save();

    return ApiResponse.success(res, newMoodCategory, "Mood category created successfully.");
});
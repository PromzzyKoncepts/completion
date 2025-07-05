const asyncHandler = require("../../middlewares/asyncHandler");
const AppLogger = require("../../middlewares/logger/logger");
const Factory = require("../../utils/factory");
const MoodCategory = require("../../models/v2/MoodCategory");
const Mood = require("../../models/v2/MoodLog");
const ApiResponse = require("../../utils/ApiResponse");
const { PushNotification } = require("../../services/pushNotifications");
const moment = require("moment");

exports.getAll = Factory.getAll(Mood);

// exports.logUserMood = asyncHandler(async (req, res, next) => {
//     const { category, emotion, note } = req.body;

//     const userId = req.user.id;

//     // Check if the category is valid and contains the provided emotion
//     // const moodCategory = await MoodCategory.findOne({ category });
//     // if (!moodCategory || !moodCategory.emotions.includes(emotion)) {
//     //     return ApiResponse.failure(res,"Invalid mood category or emotion.")
//     // }
//     const moodCategory = await MoodCategory.findOne({ category });
//     if (!moodCategory || !Array.isArray(emotion) || !emotion.every(e => moodCategory.emotions.includes(e))) {
//         return ApiResponse.failure(res, "Invalid mood category or one or more emotions.");
//     }
//     // Check if the user has already logged a mood for today
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);  // Set to start of the day
//     const existingMood = await Mood.findOne({ userId, date: today });

//     if (existingMood) {

//         return ApiResponse.failure(res,"Mood already logged for today")
//     }
//     // Create a new mood log
//     const userMood = new Mood({
//         userId,
//         category,
//         emotion,
//         note,
//         date: today
//     });

//     await userMood.save();

//     const message = `You have logged your mood as ${userMood.category}.`;

//     // Send push notification
//     await PushNotification.sendPushNotification([
//         {
//             pushToken: req.user.pushToken,
//             body: message
//         },
//     ]);
//     return ApiResponse.success(res,userMood,"Mood logged successfully.")
// });
exports.logUserMood = asyncHandler(async (req, res, next) => {
    try {
        const { category, emotion, note } = req.body;
        const userId = req.user.id;

        // Check if the category is valid and contains the provided emotions
        const moodCategory = await MoodCategory.findOne({ category });

        if (
            !moodCategory ||
            !moodCategory.emotions ||
            (Array.isArray(emotion)
                ? !emotion.every((e) => moodCategory.emotions.includes(e))
                : !moodCategory.emotions.includes(emotion))
        ) {
            return ApiResponse.failure(
                res,
                "Invalid mood category or one or more emotions."
            );
        }

        // Check if the user has already logged a mood for today
        const today = moment().startOf("day").toDate();
        const tomorrow = moment().endOf("day").toDate();

        const existingMood = await Mood.findOne({
            userId,
            date: { $gte: today, $lt: tomorrow },
        });

        if (existingMood) {
            return ApiResponse.failure(res, "Mood already logged for today");
        }

        // Create a new mood log
        const userMood = new Mood({
            userId,
            category,
            emotion,
            note,
            date: today,
        });

        await userMood.save();

        const message = `You have logged your mood as ${userMood.category}.`;

        // Send push notification
        // await PushNotification.sendPushNotification([
        //     {
        //         pushToken: req.user.pushToken,
        //         body: message
        //     }
        // ]);

        return ApiResponse.success(res, userMood, "Mood logged successfully.");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.failure(res, `An error occurred: ${error.message}`);
    }
});

exports.getMoodLogsForLast7Days = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Get today's date and set it to the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Set to the start of the day 7 days ago

    // Fetch mood logs for the previous 7 days
    const moodLogs = await Mood.find({
        userId,
        date: {
            $gte: sevenDaysAgo,
            $lte: today,
        },
    }).sort({ date: 1 }); // Sort by date in ascending order

    if (!moodLogs.length) {
        return ApiResponse.failure(
            res,
            "No mood logs found for the past 7 days."
        );
    }

    // Return the mood logs
    return ApiResponse.success(
        res,
        moodLogs,
        "Mood logs fetched successfully."
    );
});

exports.getMoodLogsForTimeFrames = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const period = req.params.period; // Assuming period is passed as a URL parameter

    // Get today's date and set it to the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Function to get mood logs for a specific time frame
    const getMoodLogsForPeriod = async (startDate) => {
        // Fetch mood logs for the given period (startDate to today)
        const moodLogs = await Mood.find({
            userId,
            date: {
                $gte: startDate,
                $lte: today,
            },
        }).sort({ date: 1 });

        return moodLogs;
    };

    let startDate;
    let periodText;

    // Determine the start date based on the period parameter
    if (period === "M") {
        // For 1 month
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 1);
        periodText = "1 month";
    } else if (period === "3M") {
        // For 3 months
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 3);
        periodText = "3 months";
    } else if (period === "Y") {
        // For 1 year
        startDate = new Date();
        startDate.setFullYear(today.getFullYear() - 1);
        periodText = "1 year";
    } else {
        return ApiResponse.failure(res, "Invalid period parameter.");
    }

    // Fetch mood logs for the given period
    const moodLogs = await getMoodLogsForPeriod(startDate);

    // Prepare the response
    const response = {
        period: periodText,
        startDate: startDate,
        endDate: today,
        logs: moodLogs,
    };

    // Check if no logs are found and return failure if so
    if (!moodLogs.length) {
        return ApiResponse.failure(
            res,
            `No mood logs found for the past ${periodText}.`
        );
    }

    // Return the mood logs for the selected period
    return ApiResponse.success(
        res,
        response,
        "Mood logs fetched successfully."
    );
});

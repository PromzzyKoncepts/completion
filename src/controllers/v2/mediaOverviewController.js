const asyncHandler = require("../../middlewares/asyncHandler");
const AppLogger = require("../../middlewares/logger/logger");
const ApiResponse = require("../../utils/ApiResponse");
const MediaOverview = require("../../models/v2/mediaOverviewSchema");

// exports.getMediaOverview = asyncHandler(async (req, res, next) => {
//     try {
//         const { startDate, endDate } = req.query;

//         AppLogger.info(
//             `Media overview fetch request received with date range. startDate: ${startDate}, endDate: ${endDate}`
//         );

//         // Build query object
//         const query = {};
//         if (startDate || endDate) {
//             query.createdAt = {};
//             if (startDate) query.createdAt.$gte = new Date(startDate);
//             if (endDate) query.createdAt.$lte = new Date(endDate);
//         }

//         const overviews = await MediaOverview.find(query).sort({
//             createdAt: -1,
//         });

//         if (!overviews.length) {
//             AppLogger.warn(
//                 "No media overview records found for the specified date range."
//             );
//             return ApiResponse.error(
//                 res,
//                 "No media overview data found for the specified date range."
//             );
//         }

//         AppLogger.info("Media overview records fetched successfully.");
//         return ApiResponse.success(
//             res,
//             overviews,
//             "Media overview records retrieved successfully."
//         );
//     } catch (error) {
//         AppLogger.error(
//             `Error fetching media overview records. Error: ${error.message}`
//         );
//         return ApiResponse.error(res, "Error fetching media overview records.");
//     }
// });
exports.getWeeklyMediaTrends = asyncHandler(async (req, res, next) => {
    try {
        let { startDate, endDate } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Default range = last 14 days if not provided
        if (!startDate || !endDate) {
            endDate = today;
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 13); // 14-day range
        } else {
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        const records = await MediaOverview.find({
            recordDate: { $gte: startDate, $lte: endDate },
        }).sort({ recordDate: 1 }); // Oldest to newest

        // Separate last 7 and previous 7 only if enough records
        const thisWeek = records.slice(-7);
        const lastWeek = records.length >= 14 ? records.slice(-14, -7) : [];

        const sum = (data, key) =>
            data.reduce((acc, r) => acc + (r[key] || 0), 0);
        const getPercent = (prev, curr) => {
            if (prev === 0 && curr === 0) return "0%";
            if (prev === 0) return "∞";
            return (((curr - prev) / prev) * 100).toFixed(1) + "%";
        };

        const result = {
            startDate,
            endDate,
            Past7Days: {
                mediaFavourited: sum(thisWeek, "mediaFavourited"),
                mediaShared: sum(thisWeek, "mediaShared"),
                articleClicks: sum(thisWeek, "articleClicks"),
                videoPlays: sum(thisWeek, "videoPlays"),
            },

            changePercent: {
                mediaFavourited: getPercent(
                    sum(lastWeek, "mediaFavourited"),
                    sum(thisWeek, "mediaFavourited")
                ),
                mediaShared: getPercent(
                    sum(lastWeek, "mediaShared"),
                    sum(thisWeek, "mediaShared")
                ),
                articleClicks: getPercent(
                    sum(lastWeek, "articleClicks"),
                    sum(thisWeek, "articleClicks")
                ),
                videoPlays: getPercent(
                    sum(lastWeek, "videoPlays"),
                    sum(thisWeek, "videoPlays")
                ),
            },
        };

        return ApiResponse.success(
            res,
            result,
            "Media trends fetched successfully."
        );
    } catch (error) {
        AppLogger.error(`Error getting media trends: ${error.message}`);
        return ApiResponse.error(res, "Could not fetch media trends.");
    }
});

exports.updateMediaOverview = asyncHandler(async (req, res, next) => {
    try {
        const { type, count = 1 } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day

        AppLogger.info(
            `Media overview update received. Type: ${type}, Count: ${count}`
        );

        // Try finding today's record
        let overview = await MediaOverview.findOne({ recordDate: today });

        // If not found, create a new one
        if (!overview) {
            AppLogger.info(
                "No MediaOverview found for today. Creating new one."
            );
            overview = new MediaOverview({ recordDate: today });
        }

        switch (type) {
            case "favourite":
                overview.mediaFavourited += count;
                break;

            case "share":
                overview.mediaShared += count;
                break;

            case "click":
                overview.articleClicks += count;
                break;

            case "play":
                overview.videoPlays += count;
                break;

            default:
                AppLogger.warn(`Invalid type received: ${type}`);
                return ApiResponse.error(
                    res,
                    "Invalid type. Use: favourite, share, click, play."
                );
        }

        await overview.save();

        return ApiResponse.success(res, overview, "Media overview updated.");
    } catch (error) {
        AppLogger.error(`Update error: ${error.message}`);
        return ApiResponse.error(res, "Update failed.");
    }
});

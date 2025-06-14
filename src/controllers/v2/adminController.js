const asyncHandler = require("../../middlewares/asyncHandler");
const AppError = require("../../utils/appError");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const MailNotificationService = require("../../services/mailNotificationService");
const User = require("../../models/v2/Base");
const Session = require("../../models/v2/Session");
const Report = require("../..//models/v2/ReportUser");
const Convo = require("../..//models/v2/Convo");
const Media = require("../..//models/v2/Media");
const Feedback = require("../../models/v2/UserFeedback");
const Incidents = require("../../models/v2/ReportUser");
const AppLogger = require("../../middlewares/logger/logger");
const Factory = require("../../utils/factory");
const ApiResponse = require("../../utils/ApiResponse");
const ReportUser = require("../../models/v2/ReportUser");

exports.getBlockedUser = asyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const { accountType, userId } = req.query;

        if (
            !accountType ||
            !["counsellor", "serviceuser"].includes(accountType)
        ) {
            return ApiResponse.error(
                res,
                "Invalid or missing accountType. Must be 'counsellor' or 'serviceuser'.",
                400
            );
        }

        if (!userId) {
            return ApiResponse.error(res, "Missing userId parameter.", 400);
        }

        const user = await User.findOne({
            _id: userId,
            accountType,
            "blocked.status": true,
            $or: [
                { "blocked.unblockDate": { $gt: now } },
                { "blocked.unblockDate": null },
            ],
        }).select("firstName lastName blocked accountType");

        if (!user) {
            return ApiResponse.error(res, "Blocked user not found.", 404);
        }

        const { blocked } = user;
        const fullName = `${user.firstName || ""} ${
            user.lastName || ""
        }`.trim();

        let timeLeft = null;
        if (blocked.unblockDate) {
            const msLeft = blocked.unblockDate.getTime() - now.getTime();
            const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
            timeLeft = `${days}d ${hours}h ${minutes}m`;
        } else {
            timeLeft = "Permanent";
        }

        const formattedUser = {
            userId: user._id,
            name: fullName || "N/A",
            isBlocked: blocked.status,
            blockedType: blocked.type,
            blockedAt: blocked.blockedAt,
            reportItem: blocked.reportedItem,
            timeLeft,
            accountType: user.accountType,
        };

        return ApiResponse.success(
            res,
            formattedUser,
            "Blocked user fetched successfully."
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Failed to fetch blocked user.");
    }
});

exports.getBlockedUsers = asyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const { accountType } = req.query;

        if (
            !accountType ||
            !["counsellor", "serviceuser"].includes(accountType)
        ) {
            return ApiResponse.error(
                res,
                "Invalid or missing accountType. Must be 'counsellor' or 'serviceuser'.",
                400
            );
        }

        const users = await User.find({
            "blocked.status": true,
            accountType,
            $or: [
                { "blocked.unblockDate": { $gt: now } },
                { "blocked.unblockDate": null },
            ],
        }).select("firstName lastName blocked accountType");

        const formattedUsers = users.map((user) => {
            const { blocked } = user;
            console.log(blocked);
            const fullName = `${user.firstName || ""} ${
                user.lastName || ""
            }`.trim();

            let timeLeft = null;

            if (blocked.unblockDate) {
                const msLeft = blocked.unblockDate.getTime() - now.getTime();
                const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
                const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
                timeLeft = `${days}d ${hours}h ${minutes}m`;
            } else {
                timeLeft = "Permanent";
            }

            return {
                userId: user._id, // <-- Here
                name: fullName || "N/A",
                isBlocked: blocked.status,
                blockedType: blocked.type,
                blockedAt: blocked.blockedAt,
                reportItem: blocked.reportedItem,
                timeLeft,
                accountType: user.accountType,
            };
        });

        return ApiResponse.success(
            res,
            formattedUsers,
            "Blocked users fetched successfully."
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Failed to fetch blocked users.");
    }
});

exports.unblockUser = asyncHandler(async (req, res, next) => {
    try {
        const { userId, reason } = req.body;
        AppLogger.info(`Unblock request received for userId: ${userId}`);

        const user = await User.findById(userId);
        if (!user) {
            AppLogger.warn(
                `User not found for unblock request. userId: ${userId}`
            );
            return ApiResponse.notFound(res, "User not found");
        }

        if (!["serviceuser", "counsellor"].includes(user.accountType)) {
            AppLogger.warn(
                `Attempt to unblock a non-serviceuser/counsellor. userId: ${userId}, accountType: ${user.accountType}`
            );
            return ApiResponse.error(
                res,
                "Only serviceuser or counsellor can be unblocked."
            );
        }

        if (!user.blocked.status) {
            AppLogger.info(
                `Unblock request denied; user is not blocked. userId: ${userId}`
            );
            return ApiResponse.error(res, "User is not currently blocked.");
        }

        // Save current block to blockHistory before unblocking
        user.blockHistory = user.blockHistory || [];
        user.blockHistory.push({ ...user.blocked });

        // Update block info to unblock user
        user.blocked = {
            status: false,
            reason: "",
            type: "None",
            blockedAt: null,
            unblockDate: null,
            manuallyUnblocked: true,
        };

        await user.save();

        AppLogger.info(
            `User unblocked successfully. userId: ${userId}, reason: ${
                reason || "Manually unblocked"
            }`
        );

        return ApiResponse.success(
            res,
            {},
            "User has been unblocked successfully."
        );
    } catch (error) {
        AppLogger.error(
            `Error unblocking user. userId: ${req.body.userId}, error: ${error.message}`
        );
        return ApiResponse.error(res, "Error unblocking user");
    }
});

exports.blockUser = asyncHandler(async (req, res, next) => {
    try {
        const { userId, reason, type, reportedItem } = req.body;

        if (!["1 week", "2 weeks", "1 month", "Permanent"].includes(type)) {
            return ApiResponse.error(res, "Invalid block type.");
        }

        const user = await User.findById(userId);
        if (!user) {
            return ApiResponse.notFound(res, "User not found");
        }

        if (!["serviceuser", "counsellor"].includes(user.accountType)) {
            return ApiResponse.error(
                res,
                "Only serviceuser or consellor can be blocked."
            );
        }

        const reportCount = await ReportUser.countDocuments({
            reportedUser: user._id,
            status: { $in: ["unresolved", "reviewed"] },
        });

        if (reportCount === 0) {
            return ApiResponse.error(
                res,
                "User cannot be blocked because they have not been reported."
            );
        }

        const now = new Date();

        // Check if user is already blocked and block is active
        if (user.blocked.status) {
            if (!user.blocked.unblockDate || user.blocked.unblockDate > now) {
                return ApiResponse.error(res, "User is already blocked.");
            }
            // else block expired, allow re-block
        }

        // Calculate unblock date
        let unblockDate = null;
        if (type !== "Permanent") {
            const durationMap = {
                "1 week": 7,
                "2 weeks": 14,
                "1 month": 30,
            };
            const days = durationMap[type];
            unblockDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        }

        // Save current block into blockHistory if any
        if (user.blocked.status) {
            user.blockHistory = user.blockHistory || [];
            user.blockHistory.push({ ...user.blocked });
        }

        // Set new block
        user.blocked = {
            status: true,
            reason,
            type,
            blockedAt: now,
            unblockDate,
            manuallyUnblocked: false,
            reportedItem,
        };

        await user.save();

        return ApiResponse.success(
            res,
            {},
            "User has been blocked successfully."
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error blocking user");
    }
});

exports.getTownSquareOverview = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Ensure startDate and endDate are provided
        if (!startDate || !endDate) {
            return ApiResponse.error(
                res,
                "Please provide both startDate and endDate",
                400
            );
        }

        // Convert to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire endDate

        const currentEnd = new Date();
        const currentStart = new Date();
        currentStart.setDate(currentEnd.getDate() - 30);

        // Only calculate percentage if dates are different from current range
        let convoPercentageChange = 0;
        if (
            startDate &&
            endDate &&
            (start.toISOString() !== currentStart.toISOString() ||
                end.toISOString() !== currentEnd.toISOString())
        ) {
            // Get convo counts for both periods
            const [currentPeriodConvos, selectedPeriodConvos] =
                await Promise.all([
                    Convo.countDocuments({
                        createdAt: { $gte: currentStart, $lte: currentEnd },
                    }),
                    Convo.countDocuments({
                        createdAt: { $gte: start, $lte: end },
                    }),
                ]);

            // Calculate percentage change
            if (currentPeriodConvos > 0) {
                convoPercentageChange = Math.round(
                    ((selectedPeriodConvos - currentPeriodConvos) /
                        currentPeriodConvos) *
                        100
                );
            }
        }

        // Fetch counts with date range filter
        const [
            totalUsers,
            newUsers,
            userIncidents,
            newIncidents,
            counsellorCount,
            activeCounsellorsCount,
            mediaCount,
            newMediaCount,
            questionCount,
            totalSessions,
        ] = await Promise.all([
            User.countDocuments(), // Total users
            User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            Incidents.countDocuments(),
            Incidents.countDocuments({ createdAt: { $gte: start, $lte: end } }),
            User.countDocuments({
                accountType: "counsellor",
                createdAt: { $gte: start, $lte: end },
            }), // Counsellors in date range

            User.countDocuments({
                // Add this new count for active counsellors
                accountType: "counsellor",
                lastActive: { $gte: start, $lte: end },
            }),
            Media.countDocuments({
                type: "video",
            }), // Videos in date range
            Media.countDocuments({
                type: "video",
                createdAt: { $gte: start, $lte: end },
            }), // Videos in date range
            Convo.countDocuments({ createdAt: { $gte: start, $lte: end } }), // Questions in date range
            Session.countDocuments({ createdAt: { $gte: start, $lte: end } }), // Sessions in date range
        ]);

        // Send response
        return ApiResponse.success(
            res,
            {
                totalUsers,
                newUsers,
                userIncidents,
                newIncidents,
                counsellorCount,
                activeCounsellorsCount,
                mediaCount,
                newMediaCount,
                questionCount,
                convoPercentageChange,
                totalSessions,
            },
            "Town square overview fetched successfully"
        );
    } catch (error) {
        AppLogger.error(error.message);
        return ApiResponse.error(res, "Error fetching town square overview");
    }
});

exports.getUserOverview = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate, accountType } = req.query;

        if (!startDate || !endDate) {
            return ApiResponse.error(
                res,
                "Please provide both startDate and endDate",
                400
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full day

        // Build accountType filter
        const userFilter = accountType ? { accountType } : {};

        // Total users with optional accountType
        const totalUsers = await User.countDocuments(userFilter);

        // Active users with accountType filter
        const activeUsers = await User.countDocuments({
            ...userFilter,
            lastActive: { $gte: start, $lte: end },
        });

        // New users within date range and accountType
        const newUsers = await User.countDocuments({
            ...userFilter,
            createdAt: { $gte: start, $lte: end },
        });

        // User incidents (not filtered by accountType unless incidents are tied to user accountType)
        const userIncidents = await Incidents.countDocuments({
            createdAt: { $gte: start, $lte: end },
        });

        return ApiResponse.success(
            res,
            {
                totalUsers,
                activeUsers,
                newUsers,
                userIncidents,
            },
            "User overview fetched successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error fetching user overview");
    }
});

// exports.getUserOverview = asyncHandler(async (req, res, next) => {
//     try {
//         const { startDate, endDate } = req.query;

//         // Ensure startDate and endDate are provided
//         if (!startDate || !endDate) {
//             return ApiResponse.error(
//                 res,
//                 "Please provide both startDate and endDate",
//                 400
//             );
//         }

//         // Convert to Date objects
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999); // Include the entire endDate

//         // Fetch total users
//         const totalUsers = await User.countDocuments();

//         // Fetch active users within date range
//         const activeUsers = await User.countDocuments({
//             lastActive: { $gte: start, $lte: end },
//         });

//         // Fetch new users within date range
//         const newUsers = await User.countDocuments({
//             createdAt: { $gte: start, $lte: end },
//         });

//         // Fetch user incidents within date range
//         const userIncidents = await Incidents.countDocuments({
//             createdAt: { $gte: start, $lte: end },
//         });

//         // Send response
//         return ApiResponse.success(
//             res,
//             {
//                 totalUsers,
//                 activeUsers,
//                 newUsers,
//                 userIncidents,
//             },
//             "User overview fetched successfully"
//         );
//     } catch (error) {
//         AppLogger.error(error);
//         return ApiResponse.error(res, "Error fetching user overview");
//     }
// });

exports.getUserManagement = asyncHandler(async (req, res, next) => {
    try {
        let { page = 1, limit = 10, blocked, accountType } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        const skip = (page - 1) * limit;

        // Build the filter object
        let filter = {};
        if (blocked !== undefined) {
            filter.blocked = blocked === "true"; // Convert string to boolean
        }

        // ✅ Add this block to filter by accountType if provided
        if (accountType) {
            filter.accountType = accountType;
        }

        const users = await User.aggregate([
            { $match: filter }, // Apply both filters: blocked & accountType
            {
                $lookup: {
                    from: "sessions",
                    localField: "_id",
                    foreignField: "user",
                    as: "userSessions",
                },
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    deactivationStatus: 1,
                    blocked: 1,
                    createdAt: 1,
                    sessionCount: { $size: "$userSessions" },
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const totalUsers = await User.countDocuments(filter);

        const transformedUsers = users.map((user) => {
            const createdDate = new Date(user.createdAt);
            const currentDate = new Date();

            const yearDiff =
                currentDate.getFullYear() - createdDate.getFullYear();
            const monthDiff =
                currentDate.getMonth() + 1 - (createdDate.getMonth() + 1);

            let accountAge;
            if (yearDiff < 1) {
                accountAge = `${Math.max(monthDiff, 1)} month${
                    monthDiff > 1 ? "s" : ""
                }`;
            } else {
                accountAge = `${yearDiff} year${yearDiff > 1 ? "s" : ""}`;
            }

            return {
                firstName: user.firstName,
                lastName: user.lastName,
                status: user.deactivationStatus
                    ? "Inactive"
                    : user.blocked
                    ? "Blocked"
                    : "Active",
                accountAge,
                sessionCount: user.sessionCount,
                engagements: "230",
                rating: 4.5,
                country: "Germany",
                avgEngagementTime: "2m 45s",
                topFeature: "Video Calling",
                eventCount: 12500,
            };
        });

        return ApiResponse.success(
            res,
            {
                totalUsers,
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                users: transformedUsers,
            },
            " management data fetched successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error fetching  management data");
    }
});

// exports.getUserManagement = asyncHandler(async (req, res, next) => {
//     try {
//         let { page = 1, limit = 10, blocked } = req.query;
//         page = parseInt(page);
//         limit = parseInt(limit);

//         if (page < 1) page = 1;
//         if (limit < 1) limit = 10;

//         const skip = (page - 1) * limit;

//         // Build the filter object
//         let filter = {};
//         if (blocked !== undefined) {
//             filter.blocked = blocked === "true"; // Convert string to boolean
//         }

//         // Fetch users with session count and apply filter
//         const users = await User.aggregate([
//             { $match: filter }, // Apply filter for blocked users
//             {
//                 $lookup: {
//                     from: "sessions",
//                     localField: "_id",
//                     foreignField: "user",
//                     as: "userSessions",
//                 },
//             },
//             {
//                 $project: {
//                     firstName: 1,
//                     lastName: 1,
//                     deactivationStatus: 1,
//                     blocked: 1,
//                     createdAt: 1,
//                     sessionCount: { $size: "$userSessions" }, // Count the number of sessions
//                 },
//             },
//             { $sort: { createdAt: -1 } }, // Sorting by newest users first
//             { $skip: skip },
//             { $limit: limit },
//         ]);

//         console.log("USers: ", users);
//         // Get total count of filtered users
//         const totalUsers = await User.countDocuments(filter);

//         // Transform users to include accountAge
//         const transformedUsers = users.map((user) => {
//             const createdDate = new Date(user.createdAt);
//             const currentDate = new Date();

//             const yearDiff =
//                 currentDate.getFullYear() - createdDate.getFullYear();
//             const monthDiff =
//                 currentDate.getMonth() + 1 - (createdDate.getMonth() + 1);

//             let accountAge;
//             if (yearDiff < 1) {
//                 accountAge = `${Math.max(monthDiff, 1)} month${
//                     monthDiff > 1 ? "s" : ""
//                 }`;
//             } else {
//                 accountAge = `${yearDiff} year${yearDiff > 1 ? "s" : ""}`;
//             }

//             return {
//                 firstName: user.firstName,
//                 lastName: user.lastName,
//                 status: user.deactivationStatus
//                     ? "Inactive"
//                     : user.blocked
//                     ? "Blocked"
//                     : "Active",
//                 accountAge,
//                 sessionCount: user.sessionCount, // Include session count
//                 engagements: "0",
//             };
//         });

//         return ApiResponse.success(
//             res,
//             {
//                 totalUsers,
//                 currentPage: page,
//                 totalPages: Math.ceil(totalUsers / limit),
//                 users: transformedUsers,
//             },
//             "User management data fetched successfully"
//         );
//     } catch (error) {
//         AppLogger.error(error);
//         return ApiResponse.error(res, "Error fetching user management data");
//     }
// });

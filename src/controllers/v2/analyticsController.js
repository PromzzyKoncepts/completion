// controllers/v2/analyticsController.js
const mongoose = require("mongoose");
const User = require("../../models/v2/Base");
const Media = require("../../models/v2/Media");
const Session = require("../../models/v2/Session");
const ApiResponse = require("../../utils/ApiResponse");


/**
 * @description Get signup analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSignupAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date inputs
        if (!startDate || !endDate) {
            return ApiResponse.failure(res, "Start date and end date are required");
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime())) {
            return ApiResponse.failure(res, "Invalid start date format");
        }
        
        if (isNaN(end.getTime())) {
            return ApiResponse.failure(res, "Invalid end date format");
        }
        
        // Group signups by month
        const signups = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        
        // Format data for frontend
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const formattedData = months.map((month, index) => {
            const found = signups.find(s => s._id.month === index + 1);
            return {
                month,
                count: found ? found.count : 0
            };
        });
        
        // Calculate percentage change
        let percentageChange = 0;
        if (signups.length >= 2) {
            const firstCount = signups[0].count;
            const lastCount = signups[signups.length - 1].count;
            percentageChange = ((lastCount - firstCount) / firstCount) * 100;
        }
        
        return ApiResponse.success(res, {
            data: formattedData,
            percentageChange: percentageChange.toFixed(2)
        });
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * @description Get media engagement analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMediaEngagementAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date inputs
        if (!startDate || !endDate) {
            return ApiResponse.failure(res, "Start date and end date are required");
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime())) {
            return ApiResponse.failure(res, "Invalid start date format");
        }
        
        if (isNaN(end.getTime())) {
            return ApiResponse.failure(res, "Invalid end date format");
        }
        
        // Group media engagements (likes + comments) by month
        const engagements = await Media.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $project: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    totalEngagement: {
                        $add: [
                            { $size: "$likes" },
                            { $size: "$comments" }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$year",
                        month: "$month"
                    },
                    totalEngagement: { $sum: "$totalEngagement" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        
        // Format data for frontend
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const formattedData = months.map((month, index) => {
            const found = engagements.find(e => e._id.month === index + 1);
            return {
                month,
                count: found ? found.totalEngagement : 0
            };
        });
        
        // Calculate percentage change
        let percentageChange = 0;
        if (engagements.length >= 2) {
            const firstCount = engagements[0].totalEngagement;
            const lastCount = engagements[engagements.length - 1].totalEngagement;
            percentageChange = ((lastCount - firstCount) / firstCount) * 100;
        }
        
        return ApiResponse.success(res, {
            data: formattedData,
            percentageChange: percentageChange.toFixed(2)
        });
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * @description Get session analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSessionAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date inputs
        if (!startDate || !endDate) {
            return ApiResponse.failure(res, "Start date and end date are required");
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime())) {
            return ApiResponse.failure(res, "Invalid start date format");
        }
        
        if (isNaN(end.getTime())) {
            return ApiResponse.failure(res, "Invalid end date format");
        }
        
        // Group completed sessions by month
        const sessions = await Session.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: {
                        $gte: start,
                        $lte: end
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        
        // Format data for frontend
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const formattedData = months.map((month, index) => {
            const found = sessions.find(s => s._id.month === index + 1);
            return {
                month,
                count: found ? found.count : 0
            };
        });
        
        // Calculate percentage change
        let percentageChange = 0;
        if (sessions.length >= 2) {
            const firstCount = sessions[0].count;
            const lastCount = sessions[sessions.length - 1].count;
            percentageChange = ((lastCount - firstCount) / firstCount) * 100;
        }
        
        return ApiResponse.success(res, {
            data: formattedData,
            percentageChange: percentageChange.toFixed(2)
        });
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};
const ApiResponse = require("../../utils/ApiResponse");
const ReportUser = require("../../models/v2/ReportUser");
const User = require("../../models/v2/Base");
const Factory = require("../../utils/factory");
const asyncHandler = require("../../middlewares/asyncHandler");
const AppLogger = require("../../middlewares/logger/logger");
const Media = require("../../models/v2/Media");
const Article = require("../../models/v2/Article");
const Comment = require("../../models/v2/Comment");

exports.reportUser = async (req, res) => {
    try {
        const { _id } = req.user;
        const reportedUser = await User.findOne({ _id: req.body.reportedUser });
        if (!reportedUser) {
            return ApiResponse.error(res, "Reported User ID not found", 404);
        }
        const report = {
            ...req.body,
            reportedBy: _id,
            reportedUserRole: reportedUser.accountType,
            status: "pending",
        };

        const newReport = await ReportUser.create(report);

        return ApiResponse.success(res, newReport, "success", 201);
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

// exports.getUserReports = asyncHandler(async (req, res, next) => {
//     try {
//         const { startDate, endDate, status, entityType, reportedUserRole } =
//             req.query;

//         // Build the filter query
//         let filter = {};
//         if (startDate && endDate) {
//             const start = new Date(startDate);
//             const end = new Date(endDate);
//             end.setHours(23, 59, 59, 999);
//             filter.createdAt = { $gte: start, $lte: end };
//         }
//         if (status) {
//             filter.status = status;
//         }
//         if (entityType) {
//             filter.entityType = entityType; // Ensure entityType is in the schema
//         }

//         if (reportedUserRole) {
//             filter.reportedUserRole = reportedUserRole; // 'serviceuser' or 'counsellor'
//         }

//         console.log(filter);
//         // Fetch reports with issue type determination
//         const reports = await ReportUser.find(filter)
//             .populate("reportedBy", "firstName lastName email") // Populate reporter details
//             .populate("reportedUser", "firstName lastName email role") // Populate reported user details
//             .sort({ createdAt: -1 });

//         // Format response with issue type
//         const formattedReports = reports.map((report) => ({
//             _id: report._id,
//             reportedEntityId: report.reportedEntity,
//             reportedEntityType: report.entityType,
//             reportedBy: report.reportedBy,
//             reportedUser: report.reportedUser,
//             reportedUserRole: report.reportedUserRole,
//             issueType:
//                 report.reportedUserRole === "counsellor"
//                     ? "Counsellor Issue"
//                     : "User Issue",
//             description: report.description,
//             status: report.status,
//             createdAt: report.createdAt,
//         }));

//         return ApiResponse.success(
//             res,
//             formattedReports,
//             "User reports fetched successfully"
//         );
//     } catch (error) {
//         AppLogger.error(error);
//         return ApiResponse.error(res, "Error fetching user reports");
//     }
// });

exports.getUserReports = asyncHandler(async (req, res, next) => {
    try {
        const {
            startDate,
            endDate,
            status,
            entityType,
            reportedUserRole,
            page = 1,
            limit = 10,
        } = req.query;

        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);
        const skip = (parsedPage - 1) * parsedLimit;

        // Build filter
        let filter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }
        if (status) filter.status = status;
        if (entityType) filter.entityType = entityType;
        if (reportedUserRole) filter.reportedUserRole = reportedUserRole;

        // Get total count for pagination
        const total = await ReportUser.countDocuments(filter);

        const reports = await ReportUser.find(filter)
            .populate("reportedBy", "firstName lastName email")
            .populate("reportedUser", "firstName lastName email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit);

        // Add entity data
        const formattedReports = await Promise.all(
            reports.map(async (report) => {
                let reportedEntityData = null;

                if (report.entityType === "Media") {
                    reportedEntityData = await Media.findById(
                        report.reportedEntity
                    );
                } else if (report.entityType === "Article") {
                    reportedEntityData = await Article.findById(
                        report.reportedEntity
                    );
                } else if (report.entityType === "Comment") {
                    reportedEntityData = await Comment.findById(
                        report.reportedEntity
                    );
                }

                return {
                    _id: report._id,
                    reportedEntityId: report.reportedEntity,
                    reportedEntityType: report.entityType,
                    reportedEntity: reportedEntityData,
                    reportedBy: report.reportedBy,
                    reportedUser: report.reportedUser,
                    reportedUserRole: report.reportedUserRole,
                    issueType:
                        report.reportedUserRole === "counsellor"
                            ? "Counsellor Issue"
                            : "User Issue",
                    description: report.description,
                    status: report.status,
                    createdAt: report.createdAt,
                };
            })
        );

        return ApiResponse.success(
            res,
            {
                data: formattedReports,
                page: parsedPage,
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit),
            },
            "User reports fetched successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error fetching user reports");
    }
});

exports.getReport = Factory.get(ReportUser);

exports.getAllReports = Factory.getAll(ReportUser);

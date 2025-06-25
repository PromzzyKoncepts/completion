const ApiResponse = require("../../utils/ApiResponse");
const ReportUser = require("../../models/v2/ReportUser");
const User = require("../../models/v2/Base");
const Factory = require("../../utils/factory");
const asyncHandler = require("../../middlewares/asyncHandler");
const AppLogger = require("../../middlewares/logger/logger");
const Media = require("../../models/v2/Media");
const Convo = require("../../models/v2/Convo");
const Article = require("../../models/v2/Article");
const Comment = require("../../models/v2/Comment");



exports.reportUser = asyncHandler(async (req, res) => {
    const {
        reportedEntity,
        entityType,
        reportedUser,
        reportedUserRole,
        description,
    } = req.body;

    const reportedBy = req.user._id;

    // Basic validation
    if (!reportedEntity || !entityType || !reportedUser || !reportedUserRole) {
        return res.status(400).json({
            status: false,
            message:
                "Missing required fields: reportedEntity, entityType, reportedUser, or reportedUserRole.",
        });
    }

    if (!["Convo", "Comment"].includes(entityType)) {
        return res.status(400).json({
            status: false,
            message: "Invalid entityType.",
        });
    }

    if (!["serviceuser", "counsellor"].includes(reportedUserRole)) {
        return res.status(400).json({
            status: false,
            message: "Invalid reportedUserRole.",
        });
    }

    // ✅ Validate that the reportedEntity exists
    let entityExists = false;
    if (entityType === "Convo") {
        entityExists = await Convo.exists({ _id: reportedEntity });
    } else if (entityType === "Comment") {
        entityExists = await Comment.exists({ _id: reportedEntity });
    }

    if (!entityExists) {
        return res.status(404).json({
            status: false,
            message: `The ${entityType} you're trying to report does not exist.`,
        });
    }

    // ✅ Validate that the reported user exists
    const userExists = await User.exists({ _id: reportedUser });
    if (!userExists) {
        return res.status(404).json({
            status: false,
            message: "The reported user does not exist.",
        });
    }

    // 🚫 Prevent duplicate reports
    const alreadyReported = await ReportUser.findOne({
        reportedBy,
        reportedEntity,
        entityType,
    });

    if (alreadyReported) {
        return res.status(400).json({
            status: false,
            message: "You have already reported this entity.",
        });
    }

    // ✅ Create the report
    const report = await ReportUser.create({
        reportedBy,
        reportedEntity,
        entityType,
        reportedUser,
        reportedUserRole,
        description,
    });

    return res.status(201).json({
        status: true,
        message: "User reported successfully.",
        data: report,
    });
});




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

        // Build filter, force entityType to only 'Comment' or 'Convo'
        let filter = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }
        if (status) filter.status = status;
        if (reportedUserRole) filter.reportedUserRole = reportedUserRole;

        // Override entityType filter to only allow 'Comment' or 'Convo'
        filter.entityType = { $in: ["Comment", "Convo"] };

        // If client sent entityType filter, ignore it or validate it like this:
        // if (entityType && ["Comment", "Convo"].includes(entityType)) {
        //   filter.entityType = entityType;
        // }

        const total = await ReportUser.countDocuments(filter);

        const reports = await ReportUser.find(filter)
            .populate("reportedBy", "firstName lastName email")
            .populate("reportedUser", "firstName lastName email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit);

        // Map reports with content for Comment and Convo only
        const formattedReports = await Promise.all(
            reports.map(async (report) => {
                let reportedEntityContent = null;

                if (report.entityType === "Comment") {
                    const comment = await Comment.findById(report.reportedEntity);
                    reportedEntityContent = comment?.content || null;
                } else if (report.entityType === "Convo") {
                    const convo = await Convo.findById(report.reportedEntity);
                    reportedEntityContent = convo?.body || null;
                }

                return {
                    _id: report._id,
                    reportedEntityId: report.reportedEntity,
                    reportedEntityType: report.entityType,
                    reportedEntityContent: reportedEntityContent,
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
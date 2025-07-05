const { ObjectId } = require("mongoose").Types;
const User = require("../../models/v1/User");
const Session = require("../../models/v1/Session");
const SessionReview = require("../../models/v1/SessionReview");
const IntakeQuestionnaire = require("../../models/v1/IntakeQuestionnaire");
const IntakeResponse = require("../../models/v1/IntakeResponse");
const { PushNotification } = require("../../services/pushNotifications");
const MailNotificationService = require("../../services/mailNotificationService");
const VideoSDKService = require("../../services/videoSDKService");
const asyncHandler = require("../../middlewares/asyncHandler");
const AppError = require("../../utils/appError");

class SessionController {
    static createRoom = asyncHandler(async (req, res, next) => {
        const videoSDKResponse = await VideoSDKService.createRoom(
            req,
            res,
            next
        );

        res.status(201).json({
            status: "success",
            message: "Room created successfully",
            data: videoSDKResponse.data,
        });
    });

    static validateRoom = asyncHandler(async (req, res, next) => {
        const roomId = req.params.roomId;

        if (!roomId) {
            return next(new AppError("roomId is required in the params", 400));
        }

        const videoSDKResponse = await VideoSDKService.validateRoom(
            req,
            res,
            next
        );

        res.status(200).json({
            status: "success",
            message: "Room validated successfully",
            data: videoSDKResponse.data,
        });
    });

    static fetchRoom = asyncHandler(async (req, res, next) => {
        const roomId = req.params.roomId;

        if (!roomId) {
            return next(new AppError("roomId is required in the params", 400));
        }

        const videoSDKResponse = await VideoSDKService.fetchRoom(
            req,
            res,
            next
        );

        res.status(200).json({
            status: "success",
            message: "Room fetched successfully",
            data: videoSDKResponse.data,
        });
    });

    static deactivateRoom = asyncHandler(async (req, res, next) => {
        const roomId = req.params.roomId;

        if (!roomId) {
            return next(new AppError("roomId is required in the params", 400));
        }

        const videoSDKResponse = await VideoSDKService.deactivateRoom(
            req,
            res,
            next
        );

        res.status(200).json({
            status: "success",
            message: "Room deactivated successfully",
            data: videoSDKResponse.data,
        });
    });

    static createSession = asyncHandler(async (req, res) => {
        const data = { user: req.user.id, ...req.body };
        const user = await User.findOne({ _id: req.user.id });
        await Session.create(data);

        await MailNotificationService.sendMail({
            recipient: "support@positiveo.io",
            subject: "New session created",
            html: `<p>Dear Admin,
                <br /><br />
                A session request is waiting to be scheduled.
                <br /><br />
                Thank you</p>`,
        });

        if (req.body.sessionType === "session") {
            await MailNotificationService.sendMail({
                recipient: user.email,
                templateId: "d-eaa6fccd798d4464a5e409f2511baa85",
                dynamic_template_data: {
                    subject: "Therapy Confirmation",
                    username: user.name || "New user",
                },
            });
        }

        if (req.body.sessionType === "listening_ear") {
            await MailNotificationService.sendMail({
                recipient: user.email,
                templateId: "d-cc6b768b7edb4ed087e51550a6dd6777",
                dynamic_template_data: {
                    subject: "Listening Ear Confirmation",
                    username: user.name || "New user",
                },
            });
        }

        res.status(201).json({
            status: "success",
            message: "Session created successfully",
        });
    });

    static fetchSession = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return next(new AppError(`${id} is not a valid ObjectId`, 400));
        }

        const session = await Session.findOne({ _id: id }).populate({
            path: "counsellor",
            select: "name volunteer",
        });

        res.status(200).json({
            status: "success",
            data: session,
        });
    });

    static updateSession = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return next(new AppError(`${id} is not a valid ObjectId`, 400));
        }

        const data = { ...req.body };

        const session = await Session.findOneAndUpdate({ _id: id }, data, {
            new: true,
        });

        await MailNotificationService.sendMail({
            recipient: "support@positiveo.io",
            subject: "A session was updated",
            html: `<strong>${req.user?.userInfo?.name} has updated ${session?.name}</strong>`,
        });

        res.status(200).json({
            status: "success",
            message: "Session updated successfully",
            data: session,
        });
    });

    static rescheduleSession = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return next(new AppError(`${id} is not a valid ObjectId`, 400));
        }

        const data = { ...req.body };
        const session = await Session.findOneAndUpdate({ _id: id }, data, {
            new: true,
        });
        const user = await User.findOne({ _id: req.user.id });
        await MailNotificationService.sendMail({
            recipient: "support@positiveo.io",
            subject: "Rescheduled a session!",
            html: `<strong>${user.name} has rescheduled ${session?.name}</strong>`,
        });

        return res.status(200).send({
            status: "success",
            message: "Session rescheduled successfully",
            data: session,
        });
    });

    static deleteSession = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return next(new AppError(`${id} is not a valid ObjectId`, 400));
        }

        await Session.findOneAndDelete({ _id: id });

        res.status(204).json({
            status: "success",
            message: "Session deleted successfully",
        });
    });

    static fetchUserSessions = asyncHandler(async (req, res) => {
        const { period, sessionType, startDuration, endDuration } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        let query = {};

        // ?page=1&limit=10&period=past&sessionType=session&startDuration=2021-01-01&endDuration=2021-01-31
        // &fields=name,counsellor.volunteer

        switch (period) {
            case "incoming":
                query = { endTime: { $gte: new Date() } };
                break;
            case "past":
                query = { endTime: { $lt: new Date() } };
                break;
            default:
                break;
        }
        if (startDuration && endDuration) {
            query = { endTime: { $lte: endDuration, $gte: startDuration } };
        }

        if (sessionType) query["sessionType"] = sessionType;


        const sessionsQuery = Session.find({
            ...query,
            user: req.user.id,
        })
            .populate("sessionCategories", "color_code name")
            .populate("counsellor", "name profilePicture volunteer")
            .populate("user", "name profilePicture")
            .sort("-createdAt");
        const sessionsCount = await Session.countDocuments({
            ...query,
            user: req.user.id,
        });

        const totalPages = Math.ceil(sessionsCount / limit);

        const nextPage = page < totalPages ? page + 1 : null;

        sessionsQuery.skip((page - 1) * limit).limit(limit * 1);
        const sessions = await sessionsQuery;

        res.status(200).json({
            status: "success",
            page: page,
            nextPage: nextPage,
            results: sessions.length,
            data: sessions,
        });
    });

    static fetchCounsellorSessions = asyncHandler(async (req, res) => {
        const { period, sessionType, startDuration, endDuration } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let query = {};

        switch (period) {
            case "incoming":
                query = { endTime: { $gte: new Date() } };
                break;
            case "past":
                query = { endTime: { $lt: new Date() } };
                break;
            default:
                break;
        }

        if (startDuration && endDuration) {
            query = { endTime: { $lte: endDuration, $gte: startDuration } };
        }



        if (sessionType) query["sessionType"] = sessionType;
        let sessionsQuery = Session.find({
            ...query,
            counsellor: req.user.id,
        })
            .populate("sessionCategories", "color_code name")
            .populate("counsellor", "name profilePicture volunteer")
            .populate("user", "name profilePicture")
            .sort("-createdAt");

        const sessionsCount = await Session.countDocuments({
            ...query,
            counsellor: req.user.id,
        });

        const totalPages = Math.ceil(sessionsCount / limit);

        const nextPage = page < totalPages ? page + 1 : null;

        sessionsQuery = sessionsQuery.skip((page - 1) * limit).limit(limit * 1);
        const sessions = await sessionsQuery;

        res.status(200).json({
            status: "success",
            page: page,
            nextPage: nextPage,
            results: sessions.length,
            data: sessions,
        });
    });

    static fetchPeerSupportSessions = asyncHandler(async (req, res) => {
        const { period, sessionType, startDuration, endDuration } = req.query;
        let query = {};
        switch (period) {
            case "latest":
                query = { startTime: { $gte: new Date() } };
                break;
            case "past":
                query = { startTime: { $lte: new Date() } };
                break;
            default:
                break;
        }

        if (startDuration && endDuration) {
            query = { endTime: { $lte: endDuration, $gte: startDuration } };
        }

        if (sessionType) query["sessionType"] = sessionType;
        const sessions = await Session.find({
            ...query,
            counsellor: req.user.id,
        })
            .populate("sessionCategories", "color_code name")
            .populate("counsellor", "name profilePicture volunteer accountType")
            .populate("user", "name profilePicture")
            .exec();

        res.status(200).json({
            status: "success",
            data: sessions,
        });
    });

    static fetchSessionNote = asyncHandler(async (req, res, next) => {
        if (!req.params.id || !ObjectId.isValid(req.params.id)) {
            return next(
                new AppError("Session Id is not a valid Identifier", 400)
            );
        }
        const session = await Session.findOne({ _id: req.params.id }).exec();

        res.status(200).json({
            status: "success",
            data: session?.sessionNotes ?? { title: "", content: "" },
        });
    });

    static addSessionNote = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { content, title } = req.body;
        if (!req.params.id || !ObjectId.isValid(req.params.id)) {
            return next(
                new AppError("Session Id is not a valid Identifier", 400)
            );
        }
        if (!content) {
            return next(new AppError("Content cannot be blank", 400));
        }
        const session = await Session.findOneAndUpdate(
            { _id: id },
            { sessionNotes: { content, title } },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            message: "Note added Successfully",
            data: session?.sessionNotes ?? { title: "", content: "" },
        });
    });

    static addReview = asyncHandler(async (req, res, next) => {
        if (!req.body.rating || isNaN(req.body.rating)) {
            return next(
                new AppError("Invalid rating information provided", 400)
            );
        }

        if (!req.params.id || !ObjectId.isValid(req.params.id)) {
            return next(
                new AppError("Session Id is not a valid Identifier", 400)
            );
        }

        const data = await SessionReview.findOneAndUpdate(
            { reviewer: req.user.id, session: req.params.id },
            { ...req.body, reviewer: req.user.id },
            { new: true, upsert: true }
        );

        res.status(200).json({
            status: "success",
            message: "Review saved successfully",
            data,
        });
    });

    static updateCounsellorSettings = asyncHandler(async (req, res, next) => {
        if (!req.body.workDays) {
            return next(new AppError("Please enter form data", 400));
        }

        if (Object.keys(req.body.workDays).length !== 7) {
            return next(
                new AppError("Invalid work days information provided", 400)
            );
        }

        await User.findOneAndUpdate(
            { _id: req.user.id },
            { sessionPreferences: req.body }
        );

        res.status(200).json({
            status: "success",
            message: "Session preferences updated successfully",
        });
    });

    static fetchCounsellorSettings = asyncHandler(async (req, res) => {
        const data = await User.findOne({ _id: req.user.id })
            .populate(
                "sessionPreferences.preferredFields",
                "name code color_code"
            )
            .select("sessionPreferences")
            .exec();

        res.status(200).json({
            status: "success",
            data,
        });
    });

    static fetchIntakeQuestionnaire = asyncHandler(async (req, res) => {
        const data = await IntakeQuestionnaire.find().exec();

        res.status(200).json({
            status: "success",
            data,
        });
    });

    static addIntakeResponse = asyncHandler(async (req, res, next) => {
        const totalQuestions = await IntakeQuestionnaire.count({});
        if (totalQuestions !== req.body?.length) {
            return next(
                new AppError(
                    "Invalid number of questions answered. Please try again",
                    400
                )
            );
        }
        await IntakeResponse.create({
            user: req.user.id,
            response: req.body,
        });

        await User.findOneAndUpdate(
            { _id: req.user.id },
            { intakeQuestionnaireCompleted: true }
        );

        return res.status(200).json({
            status: "success",
            message:
                "Questionnaire filled in successfully  and your response recorded. Thank you!",
        });
    });

    static sessionJoinedNotification = asyncHandler(async (req, res) => {
        const session = await Session.findOne({ _id: req.params.id })
            .select("name user counsellor")
            .populate("user", "name accountType pushToken")
            .populate("counsellor", "name accountType pushToken");

        if (session.counsellor._id === req.user.id) {
            PushNotification.sendPushNotification([
                {
                    pushToken: session?.user.pushToken,
                    body: "Session in progess: User has the joined.",
                },
            ]);
        }
        if (session.user._id === req.user.id) {
            PushNotification.sendPushNotification([
                {
                    pushToken: session?.counsellor.pushToken,
                    body: "Session in progress: Counsellor has joined the session",
                },
            ]);
        }
        res.status(200).json({
            status: "success",
            message: "Notification sent successfully",
        });
    });

    static sessionChatNotification = asyncHandler(
        async ({ channelName: sessionId, from, message }) => {
            const session = await Session.findOne({ _id: sessionId })
                .select("name user counsellor")
                .populate("user", "name accountType pushToken")
                .populate("counsellor", "name accountType pushToken");

            if (session.counsellor._id == from) {
                PushNotification.sendPushNotification([
                    {
                        pushToken: session?.user?.pushToken,
                        body: message,
                        title: `New Message From ${session?.counsellor?.name?.split(" ")[0]
                            }`,
                    },
                ]);
            }
            if (session.user._id == from) {
                PushNotification.sendPushNotification([
                    {
                        pushToken: session?.counsellor?.pushToken,
                        body: message,
                        title: `New Message From ${session?.user?.name?.split(" ")[0]
                            } `,
                    },
                ]);
            }
        }
    );
}

module.exports = { SessionController };

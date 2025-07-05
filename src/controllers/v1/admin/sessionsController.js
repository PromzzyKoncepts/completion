const { ObjectId } = require("mongoose").Types;
const Session = require("../../../models/v1/Session");
const IntakeResponse = require("../../../models/v1/IntakeResponse");
const { PushNotification } = require("../../../services/pushNotifications");
const MailNotificationService = require("../../../services/mailNotificationService");
const dayjs = require("dayjs");
const calendarLinkGenerator = require("generate-google-calendar-link");

class SessionsController {
    static async fetchSessions(req, res) {
        const queryParams = { sessionType: "session" };
        const { unscheduled, date } = req.query;
        if (unscheduled) {
            queryParams.counsellor = null;
        }
        if (date) {
            queryParams.endTime = { $lte: date };
        }
        await Session.find(queryParams)
            .select(
                "name startTime endTime counsellor user sessionCategories status"
            )
            .populate("user", "name")
            .populate("counsellor", "name")
            .populate("sessionCategories", "name color_code")
            .sort({ createdAt: -1 })
            .lean()
            .exec((err, data) => {
                if (err) {
                    return res.send({ status: "error", message: err.message });
                }
                return res.send({ status: "success", data });
            });
    }

    static async fetchListeningEar(req, res) {
        const queryParams = { sessionType: "listening_ear" };
        const { unscheduled, date } = req.query;
        if (unscheduled) {
            queryParams.counsellor = null;
        }
        if (date) {
            queryParams.endTime = { $lte: date };
        }
        await Session.find(queryParams)
            .select("name startTime endTime counsellor user status")
            .populate("user", "name")
            .populate("counsellor", "name")
            .lean()
            .exec((err, data) => {
                if (err) {
                    return res.send({ status: "error", message: err.message });
                }
                return res.send({ status: "success", data });
            });
    }

    static async updateSession(req, res) {
        await Session.findOneAndUpdate(
            { _id: req.params.id },
            req.body,
            { new: true },
            async (err, data) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ status: "error", message: err.message });
                }
                const updatedSession = await Session.findOne({
                    _id: req.params.id,
                })
                    .select("user counsellor name startTime endTime")
                    .populate("user", "name pushToken email")
                    .populate("counsellor", "name pushToken email");

                if (updatedSession.counsellor) {
                    const counsellorPushToken =
                        updatedSession.counsellor?.pushToken ?? "";
                    const userPushToken = updatedSession.user?.pushToken ?? "";
                    PushNotification.sendPushNotification(
                        [counsellorPushToken, userPushToken].map(
                            (pushToken, i) => ({
                                pushToken,
                                body: `Session (${updatedSession.name}) has been assigned `,
                            })
                        )
                    );

                    MailNotificationService.sendMail({
                        recipient: updatedSession.user?.email,
                        templateId: "d-f9f4a2f059b3427d9d80ec307b0b8702",
                        dynamic_template_data: {
                            subject: "Counsellor Assigned",
                            username: updatedSession.user?.name || "User",
                            sessionDate: dayjs(updatedSession.startTime).format(
                                "MMMM DD, YYYY hh:mm a"
                            ),
                            calendarLink: calendarLink(
                                "Counsellor Session with positiveo",
                                updatedSession.startTime,
                                updatedSession.endTime
                            ),
                        },
                    });

                    MailNotificationService.sendMail({
                        recipient: updatedSession.counsellor?.email,
                        templateId: "d-3054f50149254f65b311d701929b4c8f",
                        dynamic_template_data: {
                            subject: "A service user has been assigned to you",
                            username:
                                updatedSession.counsellor?.name || "Counsellor",
                            sessionDate: dayjs(updatedSession.startTime).format(
                                "MMMM DD, YYYY hh:mm a"
                            ),
                            calendarLink: calendarLink(
                                "Counseling session on positiveo",
                                updatedSession.startTime,
                                updatedSession.endTime
                            ),
                        },
                    });
                }
                return res.send({ status: "success", data });
            }
        );
    }

    static async deleteSession(req, res) {
        await Session.findOneAndDelete({ _id: req.params.id }, (err, data) => {
            if (err) {
                return res
                    .status(400)
                    .json({ status: "error", message: err.message });
            }
            return res.send({
                status: "success",
                message: "Session has been successfully deleted",
            });
        });
    }

    static async fetchSessionNote(req, res) {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).send({
                status: "error",
                message: "Sesssion Id is not a valid Identifier",
            });
        }
        await Session.findOne({ _id: req.params.id }).exec((err, session) => {
            if (err) {
                return res.status(400).send({
                    status: "error",
                    message:
                        "Sorry, we are currently unable to load this session's notes",
                });
            }
            res.send({
                status: "success",
                note: session?.sessionNotes ?? { title: "", content: "" },
            });
        });
    }

    static async fetchSessionIntakeQuestionnaire(req, res) {
        await IntakeResponse.find({}, (err, data) => {
            if (err) {
                return res
                    .status(400)
                    .json({ status: "error", message: err.message });
            }
            return res.send({ status: "success", data });
        })
            .populate("user", "name email")
            .populate("response.question", "title");
    }
}

const calendarLink = (title, startDate, endDate) => {
    const link = calendarLinkGenerator({
        start: startDate,
        end: endDate,
        title: title,
        location: "",
        details: "For more inquiry, please contact support@positiveo.io",
    });
    return link.href;
};

module.exports = { SessionsController };

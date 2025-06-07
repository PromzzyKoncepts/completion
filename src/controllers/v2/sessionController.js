const cron = require("node-cron");
const dateFns = require("date-fns");
const { mongooseV2 } = require("../../configs/database/db");
const asyncHandler = require("../../middlewares/asyncHandler");
const Session = require("../../models/v2/Session");
const User = require("../../models/v2/Base");
const MailNotificationService = require("../../services/mailNotificationService");
const AppError = require("../../utils/appError");
const Factory = require("../../utils/factory");
const AppLogger = require("../../middlewares/logger/logger");
const { PushNotification } = require("../../services/pushNotifications");
const VideoSDKService = require("../../services/videoSDKService");
const ApiResponse = require("../../utils/ApiResponse");
const Slot = require("../../models/v2/Slot");

// TODO: use agenda for all notifications

/**
 * Send notification to user and/or leader if they missed a session
 * Notify leaders when they are requested for a session by a user
 *
 * Runs every day at 12:00 AM
 */
cron.schedule("0 0 * * *", async () => {
    const sessions = await Session.find({
        status: "completed",
        sessionHeld: false,
        startTime: { $lte: new Date() },
        missedSessionEmailSent: { $ne: true },
    }).populate("user leader");

    for (const session of sessions) {
        if (!session.userJoined) {
            // send email to user and leader
            await MailNotificationService.sendMail({
                recipient: session.user.email,
                subject: "Missed Session",
                html: `<p>Dear ${session.user.firstName || "User"},
                <br /><br />
                You missed your session with ${session.leader.firstName} ${
                    session.leader.lastName
                }.
                <br /><br />
                Thank you</p>`,
            });
        }

        if (!session.leaderJoined) {
            await MailNotificationService.sendMail({
                recipient: session.leader.email,
                subject: "Missed Session",
                html: `<p>Dear ${session.leader.firstName || "Leader"},
                <br /><br />
                You missed your session with ${session.user.firstName} ${
                    session.user.lastName
                }.
                <br /><br />
                Thank you</p>`,
            });
        }

        session.missedSessionEmailSent = true;
        await session.save();
    }

    const requestedSessions = await Session.find({
        requestedLeader: { $exists: true },
        requestedLeaderNotified: false,
    }).populate("user requestedLeader");

    for (const session of requestedSessions) {
        await MailNotificationService.sendMail({
            recipient: session.requestedLeader.email,
            subject: "Session Request",
            html: `<p>Dear ${session.requestedLeader.firstName || "Leader"},
            <br /><br />
            You have been requested for a session by ${
                session.user.firstName
            } ${session.user.lastName}.
            <br /><br />
            Thank you</p>`,
        });
        session.requestedLeaderNotified = true;
        await session.save();
    }
});

/**
 * Send follow up email to user after session completion
 *
 * Runs every 2 days
 */
cron.schedule("0 0 */2 * *", async () => {
    // get all sessions that are completed and sessionHeld is true and send follow up email to user
    const sessions = await Session.find({
        status: "completed",
        sessionHeld: true,
        followUpEmailSent: { $ne: true },
    }).populate("user leader");

    for (const session of sessions) {
        await MailNotificationService.sendMail({
            recipient: session.user.email,
            subject: "Session Follow Up",
            html: `<p>Dear ${session.user.firstName || "User"},
            <br /><br />
            How was your session with ${session.leader.firstName} ${
                session.leader.lastName
            }?
            <br /><br />
            Thank you</p>`,
        });

        session.followUpEmailSent = true;
        await session.save();
    }
});

/**
 * Object representing session levels.
 * @enum {Object.<string, number>}
 */
const sessionLevels = {
    declined: -1,
    cancelled: 0,
    completed: 1,
    requested: 2,
    booked: 3,
    assigned: 3,
    confirmed: 4,
    inProgress: 5,
};

exports.createSession = Factory.create(Session);

/**
 * Create a new session
 * @param {*} data
 * @returns
 */
const bookSession = async (data) => {
    const { slot, user, sessionData, intakeResponse, transaction, path, slotIds } = data;

    // Check for open sessions
    const openSessions = await Session.find({
        user,
        status: {
            $in: ["requested", "booked", "assigned", "confirmed", "inProgress"],
        },
    });

    if (openSessions.length > 0) {
      // Nullify this check for users who want to reschedule so that the MongoDB transaction can commit in one go
      if (!path.includes("reschedule")) {
        throw new AppError(
            "You already have an open session. Please complete it before requesting another one.",
            403
        );
      }
    }

    // Create session
    data.status = "booked";
    const session = await Session.create(
        [
            {
                user,
                counsellor: slot.counsellor,
                intakeResponse,
                ...sessionData,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime,
                slots: slotIds,
                userHasAccepted: true,
            },
        ],
        { session: transaction }
    );

    const userDetails = await User.findById(user);
    // Send notification to admin
    await MailNotificationService.sendMail({
        recipient: process.env.ADMIN_EMAIL,
        subject: "New session created",
        html: `<p>Dear Admin,
            <br /><br />
            A session request is waiting to be scheduled.
            <br /><br />
            Thank you</p>`,
    });

    // Choose template based on assistanceType type
    const templateId = "d-eaa6fccd798d4464a5e409f2511baa85";
        // sessionData.assistanceType !== "listening"
        //     ? "d-eaa6fccd798d4464a5e409f2511baa85"
        //     : "d-cc6b768b7edb4ed087e51550a6dd6777";

        // Send confirmation email to the user
    await MailNotificationService.sendMail({
        recipient: userDetails.email,
        templateId,
        dynamic_template_data: {
            subject: "Therapy Confirmation",
                // sessionData.assistanceType !== "listening"
                //     ? "Therapy Confirmation"
                //     : "Listening Ear Confirmation",
            username: userDetails.firstName || "New user",
        },
    });

    return session;
};

exports.bookSession - bookSession;

exports.getSession = Factory.get(Session);

exports.getAllSessions = Factory.getAll(Session);

exports.updateSession = Factory.update(Session);

/**
 * Update session slot id.
 * Used when a session is rescheduled from another controller
 * @param {*} newSlotId new slot id
 */
exports.updateSessionSlot = async (newSlotId) => {
    await Session.findOneAndUpdate(
        // { sessionSlot: newSlotId },
        // { sessionSlot: newSlotId },
        { new: true }
    );
};

exports.deleteSession = Factory.delete(Session);

/**
 * Get all sessions that belong to the current user.
 * Use for when the current user is a user.
 */
exports.getMySessions = async (req, res, next) => {
    req.query.user = req.user.id;
    next();
};

/**
 * Get all sessions that belong to the current user.
 * Use for when the current user is a leader (counsellor/listener)
 */
exports.getLeaderSessions = async (req, res, next) => {
    req.query.leader = req.user.id;
    next();
};

/**
 * Update session status to cancelled.
 * Used when a session slot is cancelled from another controller.
 * @param {*} slotId slot id of the session to be cancelled
 */
exports.cancelSessionBySlotId = async (slotId) => {
    const session = await Session.findOneAndUpdate(
        { slot: slotId },
        { status: "cancelled" },
        { new: true }
    );

    // send notification to user and leader
    await MailNotificationService.sendMail({
        recipient: session.user.email,
        subject: "Session Cancelled",
        html: `<p>Dear ${session.user.firstName || "User"},
        <br /><br />
        Your session has been cancelled.
        <br /><br />
        Thank you</p>`,
    });

    // TODO: Handle this type of notification settings

    await MailNotificationService.sendMail({
        recipient: session.leader.email,
        subject: "Session Cancelled",
        html: `<p>Dear ${session.leader.firstName || "leader"},
        <br /><br />
        Your session has been cancelled.
        <br /><br />
        Thank you</p>`,
    });
};

exports.updateUserJoined = asyncHandler(async (req, res, next) => {
    const agenda = req.app.get("agenda");

    const session = await Session.findById(req.params.id);

    if (!session) {
        return next(new AppError("No session found with that ID", 404));
    }
    // if level not between requested and inProgress
    if (sessionLevels[session.status] < 1) {
        return next(
            new AppError(
                "You cannot update the user joined status of this session, because it is ether cancelled or completed",
                400
            )
        );
    }

    session.userJoined = req.body.userJoined;
    await session.save();

    if (session.userJoined && !session.leaderJoined) {
        setTimeout(async () => {
            const updatedSession = await Session.findById(session._id);
            if (updatedSession.userJoined && !updatedSession.leaderJoined) {
                // TODO: Make this work.
                agenda.now("send user joined notification", {
                    session: updatedSession,
                });
            }
        }, 3 * 60 * 1000); // 3 minutes
    }

    res.status(200).json({
        status: "success",
        data: session,
    });
});

exports.updateLeaderJoined = asyncHandler(async (req, res, next) => {
    const agenda = req.app.get("agenda");

    const session = await Session.findById(req.params.id);

    if (!session) {
        return next(new AppError("No session found with that ID", 404));
    }
    // if level not between requested and inProgress
    if (sessionLevels[session.status] < 1) {
        return next(
            new AppError(
                "You cannot update the leader joined status of this session, because it is ether cancelled or completed",
                400
            )
        );
    }

    session.leaderJoined = req.body.leaderJoined;
    await session.save();

    if (session.leaderJoined && !session.userJoined) {
        setTimeout(async () => {
            const updatedSession = await Session.findById(session._id);
            if (updatedSession.leaderJoined && !updatedSession.userJoined) {
                // TODO: Make this work.
                agenda.now("send leader joined notification", {
                    session: updatedSession,
                });
            }
        }, 3 * 60 * 1000); // 3 minutes
    }

    res.status(200).json({
        status: "success",
        data: session,
    });
});

exports.assignSession = async (data) => {
    const { sessionId, leaderId } = data;

    try {
        // Fetch session and leader
        const session = await Session.findByIdAndUpdate(
            sessionId,
            { status: "assigned", leader: leaderId },
            { new: true }
        ).populate("user");

        const leader = session.leader;

        // Send notification emails
        await Promise.all([
            MailNotificationService.sendMail({
                recipient: session.user.email,
                subject: "Session Assigned",
                html: `<p>Dear ${session.user.firstName || "User"},
                <br /><br />
                Your session has been assigned to ${leader.firstName} ${
                    leader.lastName
                }.
                <br /><br />
                Thank you</p>`,
            }),
            MailNotificationService.sendMail({
                recipient: leader.email,
                subject: "Session Assigned",
                html: `<p>Dear ${leader.firstName || "Leader"},
                <br /><br />
                You have been assigned a session with ${
                    session.user.firstName
                } ${session.user.lastName}.
                <br /><br />
                Thank you</p>`,
            }),
        ]);
    } catch (error) {
        AppLogger.error(error);
    }
};

exports.respondToSession = asyncHandler(async (req, res, next) => {
    const { accepted, reason } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
        return next(new AppError("No session found with that ID", 404));
    }

    if (sessionLevels[session.status] < 1) {
        return next(
            new AppError(
                "You cannot respond to this session, because it is either cancelled or completed",
                400
            )
        );
    }

    /**
     * Defines if the current user responding is a leader or not
     */
    // const userIsLeader = req.user.role !== "user";

    /**
     * Check if the user is the creator of the session
     * It is possible for admin to create a session for a user
     */
    // const userIsCreator = req.user.accountType === "serviceuser";

    if (accepted) {
        // if (userIsLeader) {
            session.leaderHasAccepted = true;

            if (session.user.email) {
              // notify user that lead has accepted
              await MailNotificationService.sendMail({
                  recipient: session.user.email,
                  subject: "Session Accepted",
                  html: `<p>Dear ${session.user.firstName || "User"},
                  <br /><br />
                  Your session has been accepted by ${req.user.firstName} ${
                      req.user.lastName
                  }.
                  <br /><br />
                  Thank you</p>`,
              });
            }
        // } else {
            session.userHasAccepted = true;
        // }

        if (session.userHasAccepted && session.leaderHasAccepted) {
            session.status = "confirmed";
        }
    } else {
        // if (userIsLeader) {
            // session.status = "assigned";
            // session.leader = null;

            // await MailNotificationService.sendMail({
            //     recipient: session.user.email,
            //     subject: "Session Declined",
            //     html: `<p>Dear ${session.user.firstName || "User"},
            //     <br /><br />
            //     Your session has been declined by ${req.user.firstName} ${
            //         req.user.lastName
            //     }.
            //     <br /><br />
            //     Thank you</p>`,
            // });

            // if (!userIsCreator) {
            //     await MailNotificationService.sendMail({
            //         recipient: session.createdBy.email,
            //         subject: "Session Declined",
            //         html: `<p>Dear ${session.createdBy.firstName || "User"},
            //         <br /><br />
            //        The session you booked for ${
            //            session.user.firstName
            //        } has been declined by ${req.user.firstName} ${
            //             req.user.lastName
            //         }.
            //         <br /><br />
            //         Thank you</p>`,
            //     });
            // }
        // } else {
        /**
         * Send an email to the user that booked the slot informing them it was declined
         */
            // session.status = "declined";
            // session.userResponseReason = reason;

            // if (!userIsCreator && session.createdBy.email) {
            //     await MailNotificationService.sendMail({
            //         recipient: session.createdBy.email,
            //         subject: "Session Declined",
            //         html: `<p>Dear ${session.createdBy.firstName || "User"},
            //         <br /><br />
            //        ${
            //            session.user.firstName
            //        } has declined the session you booked for them with ${
            //             session.leader.firstName
            //         } ${session.leader.lastName}.
            //         <br /><br />
            //         Thank you</p>`,
            //     });
            // }
        // }
    }

    await session.save();

    res.status(200).json({
        status: "success",
        message: "Session response processed successfully",
    });
});

exports.selfAssignBookedSession = asyncHandler(async (req, res, next) => {
    const accountId = req.user.id;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
        return next(new AppError("No session found with that ID", 404));
    }

    // TODO: should be discussed with decision makers
    // if (session.requestedLeader !== accountId) {
    //     return next(
    //         new AppError("You are not authorized to assign this session", 403)
    //     );
    // }

    if (session.status !== "requested") {
        return next(
            new AppError("Session is not in the requested status", 400)
        );
    }

    session.leader = accountId;
    session.status = "assigned";
    await session.save();

    res.status(200).json({
        status: "success",
        message: "Session assigned successfully",
    });
});

/**
 * Create a new room for a session
 * Use when user and leader are have accepted the session
 */
exports.createRoom = asyncHandler(async (req, res, next) => {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
        return next(new AppError("No session found with that ID", 404));
    }

    if (session.status !== "confirmed") {
        return next(
            new AppError(
                "Session is not in the confirmed status. Please confirm the session first",
                400
            )
        );
    }

    const room = await VideoSDKService.createRoom(req, res, next);

    session.roomInfo = room;
    await session.save();

    res.status(200).json({
        status: "success",
        message: "Room created successfully",
        data: room,
        session
    });
});

exports.getRoom = asyncHandler(async (req, res, next) => {
    const room = await VideoSDKService.fetchRoom(req, res, next);

    res.status(200).json({
        status: "success",
        message: "Room fetched successfully",
        data: room,
    });
});

exports.validateRoom = asyncHandler(async (req, res, next) => {
    const room = await VideoSDKService.validateRoom(req, res, next);

    res.status(200).json({
        status: "success",
        message: "Room validated successfully",
        data: room,
    });
});

exports.deactivateRoom = asyncHandler(async (req, res, next) => {
    const room = await VideoSDKService.deactivateRoom(req, res, next);

    res.status(200).json({
        status: "success",
        message: "Room deactivated successfully",
        data: room,
    });
});

// Replicated from v1
// TODO: change to v2 requirements
exports.sessionChatNotification = asyncHandler(
    async ({ channelName, from, message }) => {
        const session = await Session.findOne({ _id: channelName })
            .select("user leader")
            .populate("user", "pushToken") // Populate the relevant fields
            .populate("leader", "pushToken"); // Populate the relevant fields

        if (session.leader._id.equals(from)) {
            PushNotification.sendPushNotification([
                {
                    pushToken: session.user.pushToken,
                    body: message,
                    title: `New Message From ${
                        session.leader.name.split(" ")[0]
                    }`,
                },
            ]);
        }

        if (session.user._id.equals(from)) {
            PushNotification.sendPushNotification([
                {
                    pushToken: session.leader.pushToken,
                    body: message,
                    title: `New Message From ${
                        session.user.name.split(" ")[0]
                    }`,
                },
            ]);
        }
    }
);

/**
 * @description This method partially implements the algorithm detailed here for finding a suitable match - https://onedrive.live.com/view?id=A461B8922F9CA320!15281&resid=A461B8922F9CA320!15281&authkey=!AEegywh-cNKOmWA&wdAccPdf=0&wdparaid=73F032B1&wdo=2&cid=a461b8922f9ca320
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data An object containing an array of counsellor matches
 */
exports.searchForCounsellor = async (req, res) => {
	try {
		const { topics, specialty, genderPreference, sessionType } = req.body;
		let { countryOfResidence, cityOfResidence, gender } = req.user;

		if (!countryOfResidence) {
			countryOfResidence = req.body.countryOfResidence;
		}

		if (!cityOfResidence) {
			cityOfResidence = req.body.cityOfResidence;
		}

		const counsellors = await User.find({
			accountType: "counsellor",
		});

		const locationFilter = await User.find({
			$or: [{ cityOfResidence }, { countryOfResidence }],
			accountType: "counsellor",
		});

		// Skip location filter for counsellors with a score less than 3
		const locationMatch = locationFilter.length ? locationFilter : counsellors;

    // Skip specialty filtering if user does not specify a specialty
		const specialtyMatch = specialty
			? locationMatch.filter((user) => user.specialisedSupport.includes(specialty))
			: locationMatch;

    if (!specialtyMatch.length) {
      return ApiResponse.success(res, {}, "No matches found");
    }
		// Filter by gender only when the user requests it
		const genderMatch =
			genderPreference === "yes"
				? locationMatch.filter((user) => user.gender === gender)
				: specialtyMatch;

		let topicMatch = topics?.length
			? genderMatch.filter((user) => topics.every((topic) => user.focusArea.includes(topic)))
			: genderMatch;
    
		// If we don't have enough matches based on topics, we need to expand the search for matches with N - 1 topics matched
		if (topics?.length > 1 && topicMatch < 3) {
			topicMatch = genderMatch.filter((user) => {
				const matches = topics
					.map((topic) => user.focusArea.includes(topic))
					.filter((value) => !value);
				return matches.length < 2;
			});
		}
		const sessionTypeMatch = topicMatch.filter((user) => user.sessionType.includes(sessionType));
    const data = sessionTypeMatch.length >= 6 ? sessionTypeMatch : [...sessionTypeMatch, ...topicMatch.slice(0, 3)];

		// return some counsellors who aren't matched by session type if the number isn't enough since this isn't a priority match criteria
		return ApiResponse.success(
			res,
			data.length ? data : {},
			(data.length ? "Success" : "No matches found"),
		);
	} catch (error) {
		ApiResponse.error(res);
	}
};

/**
 * @description Get a user's upcoming sessions. These are sessions with status as confirmed.
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data An object containing an array of a user's upcoming sessions
 */
exports.getUpcomingSessions = async (req, res) => {
  try {
    const { _id, accountType } = req.user;
    const userType = accountType === "serviceuser" ? "counsellor" : "user";
    const sessions = await Session.find({
      $and: [
        { status: "confirmed" },
        {
          $or: [
            { counsellor: _id },
            { user: _id },
          ],
        },
      ],
    })
      .populate({
        path: userType,
        select: "-password -passwordChangedAt -refreshToken -notificationSettings"
      }) // Populate the 'user' field with the corresponding User document
      .exec();

    return ApiResponse.success(res, sessions);
  } catch (error) {
    ApiResponse.error(res);
  }
}

// /**
//  * @description Get a counsellor's upcoming sessions. These are sessions with status as confirmed.
//  * @param {Req} req Express Request object
//  * @param {Res} res Express Response object
//  * @returns data An object containing an array of a counsellor's upcoming sessions
//  */
// exports.getUpcomingSessions = async (req, res) => {
//   try {
//     const { _id } = req.user;
//     const sessions = await Session.find()
//     .populate("counsellor") // Populate the 'user' field with the corresponding User document
//     .populate("sessionSlot")
//     .where("counsellor", _id) // Filter by user ID
//     .where("status", "confirmed")
//     .exec();

//     const freeSlots = await Slot.find({ counsellor: _id, status: "available" }).select(["startDateTime", "endDateTime"]);

//     return ApiResponse.success(res, { ...sessions, ...freeSlots });
//   } catch (error) {
//     ApiResponse.error(res);
//   }
// }

/**
 * @description Get a user's session history. These are sessions with status as completed.
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data An object containing an array of a user's sessions history
 */
exports.getSessionHistory = async (req, res) => {
  try {
    const { _id } = req.user;
    const sessions = await Session.find()
    .populate("user") // Populate the 'user' field with the corresponding User document
    // .populate("sessionSlot")
    .where("counsellor", _id) // Filter by user ID
    .where("status", "completed")
    .exec();

    return ApiResponse.success(res, sessions);
  } catch (error) {
    ApiResponse.error(res, error.message);
  }
}

/**
 * 
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data A session object containing the updated ratings for either a user or a counsellor
 */
exports.rateSession = async (req, res) => {
  try {
    const { accountType } = req.user;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
      return ApiResponse.error(res, "Session with provided ID does not exist", 404);
    }

    const data = {
      [accountType === "counsellor" ? "counsellorRating" : "userRating"]: { ...req.body },
      // [accountType === "counsellor" ? "counsellorRatingNotes" : "userRatingNotes"]: req.body.notes,
      // [accountType === "serviceuser" && "isUserRatingAnonymous"]: req.body.isUserRatingAnonymous
    }

    const sessionRating = await Session.findOneAndUpdate({ _id: sessionId }, data);

    return ApiResponse.success(res, sessionRating);
  } catch (error) {
    return ApiResponse.error(res);
  }
}

/**
 * @description This function searches and finds session slots for the current day and returns them to the user
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data A session object containing the user's confirmed sessions for today
 */
exports.todaysSchedule = async (req, res) => {
  try {
    const { _id } = req.user;
    const { startOfDay, endOfDay } = dateFns;
    // Define the start and end of the day
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Get sessions where the startDateTime is between the start and end of today
    const sessionsToday = await Session.find({
      "user": {
        _id,
      },
      "startTime": {
        $gte: todayStart,
        $lte: todayEnd
      },
      status: "confirmed"
    });

    return ApiResponse.success(res, sessionsToday);
  } catch (error) {
    return ApiResponse.error(res);
  }
}

/**
 * @description This function searches and finds session slots for the current month and returns them to the user
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data A session object containing the user's confirmed sessions for the month
 */
exports.monthlySessions = async (req, res) => {
  try {
    const { _id } = req.user;
    const { startOfMonth, endOfDay } = dateFns;

    const monthStart = startOfMonth(new Date());
    const todayEnd = endOfDay(new Date());

    const monthlySessions = await Session.find({
      "user": {
        _id,
      },
      "startTime": {
        $gte: monthStart,
        $lte: todayEnd
      }
    });

    return ApiResponse.success(res, monthlySessions);
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
}

/**
 * @description This function searches and finds all sessions for a user
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data A session object containing the user's sessions
 */
exports.getUserSessions = async (req, res) => {
  try {
    const { _id } = req.user;

    const userSessions = await Session.find()
    .populate("user")
    .where("user", _id);

    return ApiResponse.success(res, userSessions);
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
}


/**
 * @description Get another user's session history by ID. These are sessions with status as completed.
 * @param {Req} req Express Request object
 * @param {Res} res Express Response object
 * @returns data An object containing an array of a user's sessions history
 */
exports.getSessionHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const sessions = await Session.find({
      $or: [
        { counsellor: id },
        { user: id }
      ],
      status: "completed"
    })
      .populate("user") // Populate the 'user' field with the corresponding User document
      // .populate("sessionSlot")
      .select("-counsellorNotes")
      .exec();

    return ApiResponse.success(res, sessions);
  } catch (error) {
    ApiResponse.error(res, error.message);
  }
}

/**
 * Cancels an existing session and reopens associated slots
 * 
 * @async
 * @function cancelSession
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @description
 * - Starts a database transaction
 * - Calls cancelSessionAndOpenSlots to process session cancellation
 * - Commits transaction on success
 * - Handles transaction errors and rollback
 */
exports.cancelSession = async (req, res) => {
  const transaction = await mongooseV2.startSession();
  try {
    transaction.startTransaction();
    const { _id, accountType } = req.user;
    const session = await Session.findOne({ _id: req.params.sessionId }).session(transaction);
    if (!session) {
      res.status(404).json({ error: "Session with provided ID does not exist" });
    }
    if (session.status === "completed") {
      res.status(400).json({ error: "Cannot cancel a completed session" });
    }
    if (session.status === "cancelled") {
      res.status(400).json({ error: "Session already cancelled" });
    }
    // Authorization check
    if (accountType !== "admin" && session.counsellor.toString() !== _id.toString() && session.user.toString() !== _id.toString()) {
      throw new Error("Unauthorized: You cannot cancel another user's session");
    }

    await cancelSessionAndOpenSlots({ _id, transaction, slotIds: session.slots, session });
    await transaction.commitTransaction();

    ApiResponse.success(res, {}, "Session canceled successfully");
  } catch (error) {
    await transaction.abortTransaction();
    ApiResponse.error(res, error.message);
  } finally {
    transaction.endSession();
  }
}

/**
 * Reschedules an existing session by cancelling and rebooking
 * 
 * @async
 * @function rescheduleSession
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @description
 * - Cancels existing session and opens slots
 * - Books new slots for the session
 * - Returns updated slot and session information
 */
exports.rescheduleSession = async (req, res) => {
  const transaction = await mongooseV2.startSession();
  try {
    transaction.startTransaction();
    const { duration } = req.body;
    const numberOfSlots = duration / 15;
    const session = await Session.findById(req.params.sessionId).session(transaction);

    if (!session) {
      return res.status(404).json({ error: "Session to reschedule does not exist" });
    }

    const slot = await Slot.findOne({
      _id: req.params.slotId,
    });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
  
    const startDateTime = new Date(slot.startDateTime);
    const endDateTime = new Date(startDateTime.getTime() + 15 * numberOfSlots * 60000);

    const slots = await Slot.find({
      startDateTime: { $gte: startDateTime, $lt: endDateTime },
      counsellor: slot.counsellor,
    }).session(transaction);
  
    if (slots.length !== numberOfSlots) {
      throw new Error("Consecutive slots not available for duration requested");
    }
    const newSlotIds = slots.map((slot) => slot._id.toString());
  
    // Check for overlap between session to be canceled and new sessions to book
    // Open up slots that are NOT in the new slots to be booked. The ones that are there can remain booked
    const slotsToOpen = session.slots.filter((slot) => !newSlotIds.includes(slot.toString()));
    if (slotsToOpen.length === 0 && session.slots.length === newSlotIds.length) {
      return res.status(400).json({ error: "Cannot reschedule same session and slots" })
    }

    await cancelSessionAndOpenSlots({ _id: req.user.id, session, transaction, slotIds: slotsToOpen });

    // We will book slots that have NOT been booked already
    const slotsToBook = newSlotIds.filter((slot) => !session.slots.includes(slot.toString()));
    const { slot: newSlot, session: newSession } = await bookSlotsAndCreateSession({ req, transaction, slot, slotIds: newSlotIds, endDateTime });
    await transaction.commitTransaction();

    res.status(200).json({
      status: "success",
      data: { slot: newSlot, session: newSession },
    });
  } catch (error) {
    AppLogger.error(error);
    await transaction.abortTransaction(); // Rollback on error
    ApiResponse.error(res, error.message);
  } finally {
    transaction.endSession(); // Clean up the session
  }
}

/**
 * Cancels a session and reopens associated time slots
 * 
 * @async
 * @function cancelSessionAndOpenSlots
 * @param {Object} params - Function parameters
 * @param {Object} params._id - User ID
 * @param {Object} params.transaction - Database transaction object
 * @param {Object} params.session - Session model object
 * @param {Object} params.slotIds - Array containing slots to be opened up and made available
 * 
 * @returns {Object|void} ApiResponse error if cancellation fails, otherwise undefined
 * 
 * @throws {Error} Throws error if slot to be cancelled does not exist
 * 
 * @description
 * - Validates session existence and status
 * - Checks user permissions to cancel the session
 * - Reopens booked slots associated with the session
 * - Updates session status to 'cancelled'
 */
const cancelSessionAndOpenSlots = async ({ _id, transaction, session, slotIds }) => {
  // Lock and update each slot
  for (const _id of slotIds) {
    await Slot.findOneAndUpdate(
      { _id },
      { status: "available", user: null },
      { session: transaction, new: true }
    );
  }

  // Update session status
  session.cancelledBy = _id;
  session.status = "cancelled";
  await session.save({ session: transaction });
};


/**
 * Books multiple consecutive slots and creates a session
 * 
 * @async
 * @function bookSlotsAndCreateSession
 * @param {Object} params - Function parameters
 * @param {Object} params.req - Express request object
 * @param {Object} params.transaction - Database transaction object
 * @param {Object} params.slot - Database Slot model
 * @param {Object} params.slotIds - Array containing slots to be booked
 * @param {Object} params.endDateTime - Date string for the end of the session
 * 
 * @returns {Object} Object containing booked slot and created session
 * 
 * @throws {Error} Throws error if consecutive slots are not available
 * 
 * @description
 * - Validates availability of initial slot
 * - Books consecutive slots based on requested duration
 * - Creates reminder timestamps (currently commented out)
 * - Creates a session using booked slots
 */
const bookSlotsAndCreateSession = async ({ req, transaction, slot, slotIds, endDateTime }) => {

  for (const _id of slotIds) {
    await Slot.findOneAndUpdate(
      { _id },
      { status: "booked", user: req.user._id, bookedAt: Date.now() },
      { session: transaction, new: true }
    );
  }

  const dayBefore = new Date(
    slot.startDateTime.getTime() - 24 * 60 * 60 * 1000
  );
  const hourBefore = new Date(slot.startDateTime.getTime() - 60 * 60 * 1000);
  const minuteBefore = new Date(slot.startDateTime.getTime() - 60 * 1000);

  const agenda = req.app.get("agenda");
  let reminderJob;
  reminderJob = await agenda.schedule(
    dayBefore.toISOString(),
    "remind a day before",
    {
      userId: slot.user,
      leaderId: slot.counsellor,
      message: "Your appointment is in 24 hours.",
    }
  );

  slot.reminderJobIds.push(reminderJob.attrs._id);

  reminderJob = await agenda.schedule(
    hourBefore.toISOString(),
    "remind an hour before",
    {
      userId: "64984d2235adae26e93eae2e",
      leaderId: slot.counsellor,
      message: "Your appointment is in 1 hour.",
    }
  );

  slot.reminderJobIds.push(reminderJob.attrs._id);

  reminderJob = await agenda.schedule(
    minuteBefore.toISOString(),
    "remind a minute before",
    {
      userId: slot.user,
      leaderId: slot.counsellor,
      message: "Your appointment is in 1 minute.",
    }
  );

  slot.reminderJobIds.push(reminderJob.attrs._id);

  // create session
  const session = await bookSession({
    slot,
    user: req.user._id,
    sessionData: { ...req.body.session, startTime: slot.startDateTime, endTime: endDateTime, duration: req.body.duration },
    intakeResponse: req.body.intakeResponse,
    transaction,
    path: req.path,
    slotIds
  });

  return { slot, session };
}

exports.sendGrowthCheckIn = async (req, res) => {
  try {
    const { userId, counsellorId } = req.body;
    const numberOfUserAndCounsellorSessions = await Session.countDocuments({
      user: userId,
      counsellor: counsellorId,
    });
    if (numberOfUserAndCounsellorSessions === 3) {
      // Send 3rd week growth checkin;
      return;
    }

    if (numberOfUserAndCounsellorSessions === 6) {
      // Send 6th week growth checkin;
      return;
    }

    if (numberOfUserAndCounsellorSessions === 9) {
      // Send 9th week growth checkin;
      return;
    }

    ApiResponse.success(res, {}, "Growth check-in not due yet");
  } catch (error) {
    ApiResponse.error(res, error.message);
  }
}

exports.bookSlotsAndCreateSession = bookSlotsAndCreateSession

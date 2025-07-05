const cron = require("node-cron");
const asyncHandler = require("../../middlewares/asyncHandler");
const Slot = require("../../models/v2/Slot");
const AppError = require("../../utils/appError");
const sessionController = require("./sessionController");
const User = require("../../models/v2/Base");
const Session = require("../../models/v2/Session");
const Factory = require("../../utils/factory");
const { mongooseV2 } = require("../../configs/database/db");

// TODO: refactor repeated code

/**
 * Cron job to set expired to true for slots that have passed their end date
 */
cron.schedule("* * * * *", async () => {
  const slots = await Slot.find({
    expired: { $ne: true },
    endDateTime: { $gt: Date.now() },
  });
  slots.forEach(async (slot) => {
    slot.expired = true;
    await slot.save();
  });
});

/**
 * Create a new slot
 * @param {*} startDateTime The start date and time of the slot
 * @param {*} endDateTime The end date and time of the slot
 * @param {*} counsellor The counsellor for the slot
 * @returns The newly created slot
 */
const createNewSlot = async (startDateTime, endDateTime, counsellor) => {
  return await Slot.create({
    startDateTime,
    endDateTime,
    counsellor,
    slotId: `${counsellor}-${startDateTime}-${endDateTime}`,
    expired: false,
  });
};

/**
 * Create a new slot or many slots
 */
exports.createOneOrManySlots = asyncHandler(async (req) => {
  const agenda = req.app.get("agenda");

  let slots = req.body.slots.map((slot) => {
    slot.startDateTime = new Date(slot.startDateTime).toISOString();
    slot.endDateTime = new Date(slot.endDateTime).toISOString();

    if (slot.expiresAt) {
      slot.expiresAt = new Date(slot.expiresAt).toISOString();
    }
    return slot;
  });

  slots = slots.map(async (slot) => {
    await createNewSlot(slot.startDateTime, slot.endDateTime, req.user.id);
  });

  // for recurring slots, insert 30 more for daily, 19 for working days,
  // 4 for weekly, 2 for biweekly, 1 for monthly
  // increase the number as per new requirements if needed
  slots.forEach(async (slot) => {
    switch (slot.repeats) {
      case "daily":
        createFutureDailySlots: {
          let lastCreatedSlot = null;

          for (let i = 0; i < 30; i++) {
            const slotStartDateTime = new Date(
              new Date(slot.startDateTime).getTime() +
              (i + 1) * 24 * 60 * 60 * 1000
            );
            const slotEndDateTime = new Date(
              new Date(slot.endDateTime).getTime() +
              (i + 1) * 24 * 60 * 60 * 1000
            );

            if (slot.expiresAt) {
              if (slotStartDateTime > slot.expiresAt) {
                break createFutureDailySlots;
              }
            }

            lastCreatedSlot = await Slot.create({
              counsellor: slot.counsellor,
              startDateTime: slotStartDateTime,
              endDateTime: slotEndDateTime,
              // parentSlotId: slot.slotId,
            });
          }

          agenda.every("1 day", "create new slot", lastCreatedSlot);
        }
        break;

      case "workingDays":
        createFutureWorkingDaysSlots: {
          let dayCount = 0;
          let lastCreatedSlot = null;

          for (let i = 0; dayCount < 19; i++) {
            const slotStartDateTime = new Date(
              new Date(slot.startDateTime).getTime() +
              i * 24 * 60 * 60 * 1000
            );
            const slotEndDateTime = new Date(
              new Date(slot.endDateTime).getTime() +
              i * 24 * 60 * 60 * 1000
            );

            if (slot.expiresAt) {
              if (slotStartDateTime > slot.expiresAt) {
                break createFutureWorkingDaysSlots;
              }
            }

            if (
              slotStartDateTime.getDay() !== 0 &&
              slotStartDateTime.getDay() !== 6
            ) {
              lastCreatedSlot = await Slot.create({
                counsellor: slot.counsellor,
                startDateTime: slotStartDateTime,
                endDateTime: slotEndDateTime,
                // parentSlotId: slot.slotId,
              });
              dayCount++;
            }
          }

          agenda.every("1 week", "create new slot", lastCreatedSlot);
        }
        break;

      case "weekly":
        createFutureWeeklySlots: {
          let lastCreatedSlot = null;

          for (let i = 0; i < 5; i++) {
            const slotStartDateTime = new Date(
              new Date(slot.startDateTime).getTime() +
              (i + 1) * 7 * 24 * 60 * 60 * 1000
            );
            const slotEndDateTime = new Date(
              new Date(slot.endDateTime).getTime() +
              (i + 1) * 7 * 24 * 60 * 60 * 1000
            );

            if (slot.expiresAt) {
              if (slotStartDateTime > slot.expiresAt) {
                break createFutureWeeklySlots;
              }
            }

            lastCreatedSlot = await Slot.create({
              counsellor: slot.counsellor,
              startDateTime: slotStartDateTime,
              endDateTime: slotEndDateTime,
              // parentSlotId: slot.slotId,
            });
          }

          agenda.every("1 week", "create new slot", lastCreatedSlot);
        }
        break;

      case "biweekly":
        createFutureBiWeeklySlots: {
          let lastCreatedSlot = null;

          for (let i = 0; i < 3; i++) {
            const slotStartDateTime = new Date(
              new Date(slot.startDateTime).getTime() +
              (i + 1) * 14 * 24 * 60 * 60 * 1000
            );
            const slotEndDateTime = new Date(
              new Date(slot.endDateTime).getTime() +
              (i + 1) * 14 * 24 * 60 * 60 * 1000
            );

            if (slot.expiresAt) {
              if (slotStartDateTime > slot.expiresAt) {
                break createFutureBiWeeklySlots;
              }
            }

            lastCreatedSlot = await Slot.create({
              counsellor: slot.counsellor,
              startDateTime: slotStartDateTime,
              endDateTime: slotEndDateTime,
              // parentSlotId: slot.slotId,
            });
          }

          agenda.every("2 weeks", "create new slot", lastCreatedSlot);
        }
        break;

      case "monthly":
        createFutureMonthlySlots: {
          let lastCreatedSlot = null;

          for (let i = 0; i < 2; i++) {
            const slotStartDateTime = new Date(
              new Date(slot.startDateTime).getTime() +
              (i + 1) * 30 * 24 * 60 * 60 * 1000
            );
            const slotEndDateTime = new Date(
              new Date(slot.endDateTime).getTime() +
              (i + 1) * 30 * 24 * 60 * 60 * 1000
            );

            if (slot.expiresAt) {
              if (slotStartDateTime > slot.expiresAt) {
                break createFutureMonthlySlots;
              }
            }

            lastCreatedSlot = await Slot.create({
              counsellor: slot.counsellor,
              startDateTime: slotStartDateTime,
              endDateTime: slotEndDateTime,
              // parentSlotId: slot.slotId,
            });
          }

          agenda.every("1 month", "create new slot", lastCreatedSlot);
        }
        break;
    }
  });

  // res.status(201).json({
  //     status: "success",
  //     message: "Slot(s) created successfully",
  // });
});

exports.getSlot = Factory.get(Slot);

exports.getAllSlots = Factory.getAll(Slot);

exports.updateSlot = Factory.update(Slot);

/**
 * Gets the leaders availability from the current day and time
 */
exports.getNextFreeSlots = asyncHandler(async (req, res, next) => {
  const currentDateTime = new Date().toISOString();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  const slots = await Slot.find({
    startDateTime: { $gte: currentDateTime },
    // expired: { $ne: true },
    status: { $ne: "booked" },
  })
    .skip(startIndex)
    .limit(limit)
    .populate({ path: "counsellor", select: "firstName lastName email" });

  const total = await Slot.countDocuments({
    startDateTime: { $gte: currentDateTime },
    expired: { $ne: true },
    status: { $ne: "booked" },
  });

  const nextPage = page * limit < total ? page + 1 : null;
  const prevPage = page - 1 > 0 ? page - 1 : null;

  res.status(200).json({
    status: "success",
    count: slots.length,
    page,
    limit,
    prevPage,
    nextPage,
    total,
    data: slots,
  });
});

/**
 * Book a slot and create a session
 */
exports.bookSlot = asyncHandler(async (req, res, next) => {
  const transaction = await mongooseV2.startSession();
  try {
    transaction.startTransaction();
    const { duration } = req.body;
    const numberOfSlots = duration / 15;

    const slot = await Slot.findOne({
      _id: req.params.slotId,
      status: "available",
    });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }

    const numberOfUserAndCounsellorSessions = await Session.countDocuments({
      user: req.user._id,
      counsellor: slot.counsellor,
    });

    if (numberOfUserAndCounsellorSessions > 9) {
      // Implement restriction on number of sessions a user can book with a counsellor
    }
    const startDateTime = new Date(slot.startDateTime);
    const endDateTime = new Date(startDateTime.getTime() + 15 * numberOfSlots * 60000);

    const slots = await Slot.find({
      startDateTime: { $gte: startDateTime, $lt: endDateTime },
      counsellor: slot.counsellor,
      ...(!req.path.includes("reschedule") && { status: "available" }),
    }).session(transaction);

    if (slots.length !== numberOfSlots) {
      throw new Error("Consecutive slots not available for duration requested");
    }
    const newSlotIds = slots.map((slot) => slot._id);

    const { slot: newSlot, session } = await sessionController.bookSlotsAndCreateSession({ req, transaction, slot, slotIds: newSlotIds, endDateTime });
    await transaction.commitTransaction();

    res.status(200).json({
      status: "success",
      data: { slot: newSlot, session },
    });
  } catch (error) {
    await transaction.abortTransaction();
    if (
      error.message ===
      "You already have an open session. Please complete it before requesting another one." ||
      error.message ===
      "Consecutive slots not available for duration requested"
    ) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  } finally {
    transaction.endSession();
  }
});

/**
 * Delete a slot and all its child slots
 */
exports.deleteSlot = asyncHandler(async (req, res, next) => {
  const slot = await Slot.findByIdAndDelete(req.params.id);

  if (!slot) {
    return next(new AppError("No slot found", 404));
  }

  // Get the jobId from the slot
  const jobId = slot.jobId;

  const agenda = req.app.get("agenda");
  // Cancel the agenda job
  await agenda.cancel({ _id: agenda.mongo.ObjectId(jobId) });

  await Slot.deleteMany({
    $or: [
      { parentSlot: req.params.id, startDateTime: { $gte: new Date() } },
      { _id: req.params.id, expired: { $ne: false } },
    ],
  });

  res.status(204).json({
    status: "success",
    message: "Slot(s) deleted successfully",
  });
});

/**
 * Cancel a slot booking and session
 */
exports.cancelSlotBookingAndSession = asyncHandler(async (req, res, next) => {
  // make slot free, merge it with next or previous free slot and cancel session
  const slot = await Slot.findById(req.params.id);

  if (!slot) {
    return next(new AppError("No slot found", 404));
  }

  slot.status = "available";
  // slot.bookedBy = undefined;
  slot.bookedAt = undefined;

  const agenda = req.app.get("agenda");
  // get ids in reminderJobIds

  // cancel each scheduled reminder job
  if (slot.reminderJobIds) {
    for (let i = 0; i < slot.reminderJobIds.length; i++) {
      await agenda.cancel({
        _id: agenda.mongo.ObjectId(slot.reminderJobIds[i]),
      });
    }
  }

  // merge with previous or next free slot if available
  // because when a user books a slot inside a slot, new slots are created
  // so we need to merge them back to the original slot if possible
  const freeSlotBefore = await Slot.findOne({
    endDateTime: slot.startDateTime,
    status: "available",
  });

  const freeSlotAfter = await Slot.findOne({
    startDateTime: slot.endDateTime,
    status: "available",
  });

  if (freeSlotBefore && freeSlotAfter) {
    freeSlotBefore.endDateTime = freeSlotAfter.endDateTime;
    await freeSlotBefore.save();
    await freeSlotAfter.delete();
    await slot.delete();
  } else if (freeSlotBefore) {
    freeSlotBefore.endDateTime = slot.endDateTime;
    await freeSlotBefore.save();
    await slot.delete();
  } else if (freeSlotAfter) {
    freeSlotAfter.startDateTime = slot.startDateTime;
    await freeSlotAfter.save();
    await slot.delete();
  } else {
    await slot.save();
  }

  await sessionController.cancelSessionBySlotId(req.params.id);

  // send cancellation email
  agenda.now("send cancellation email", {
    userId: slot.user,
    leaderId: slot.counsellor,
  });

  res.status(204).json({
    status: "success",
    message: "Slot booking cancelled successfully",
  });
});

const scheduleNotifications = async (req, slot) => {
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
      userId: slot.user,
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

  return await slot.save();
};

/**
 * Reschedule a slot booking
 */
exports.rescheduleSlotBooking = asyncHandler(async (req, res, next) => {
  const slot = await Slot.findById(req.params.id);

  if (!slot) {
    return next(new AppError("No slot found", 404));
  }

  const agenda = req.app.get("agenda");

  const parsedStartDateTime = new Date(req.body.newStartDateTime);
  const parsedEndDateTime = new Date(req.body.newEndDateTime);

  // Check if a slot already exists in the new time
  let existingSlot = await Slot.findOne({
    startDateTime: {
      $gte: parsedStartDateTime,
      $lt: parsedEndDateTime,
    },
  });

  if (existingSlot && existingSlot.status === "booked") {
    return next(
      new AppError("There is an appointment at that time already", 409)
    );
  }

  if (existingSlot && existingSlot.status === "available") {
    existingSlot.status = "booked";
    // existingSlot.bookedBy = req.user.id;
    existingSlot.bookedAt = Date.now();
    existingSlot.user = slot.user;
    existingSlot.leader = req.user.id;
    existingSlot.startDateTime = parsedStartDateTime;
    existingSlot.endDateTime = parsedEndDateTime;

    if (slot.reminderJobIds) {
      for (const jobId of slot.reminderJobIds) {
        await agenda.cancel({ _id: agenda.mongo.ObjectId(jobId) });
      }
    }
    await slot.delete();

    existingSlot = await existingSlot.save();

    existingSlot = scheduleNotifications(req, existingSlot);

    // update session slotId

    await sessionController.updateSessionSlot(existingSlot._id);

    // send reschedule agenda job right away
    agenda.now("reschedule notification", {
      userId: slot.user,
      leaderId: slot.counsellor,
      message: "Your appointment has been rescheduled.",
    });

    return res.status(200).json({
      status: "success",
      message: "Slot booking rescheduled successfully",
      data: {
        slot: existingSlot,
      },
    });
  }

  // create a new slot
  const newSlot = await Slot.create({
    leader: slot.counsellor,
    startDateTime: parsedStartDateTime,
    endDateTime: parsedEndDateTime,
    status: "booked",
    // bookedBy: req.user.id,
    bookedAt: Date.now(),
    user: slot.user,
  });

  scheduleNotifications(req, newSlot);
  // send agenda reschedule notification right away
  agenda.now("reschedule notification", {
    userId: slot.user,
    leaderId: slot.counsellor,
    message: "Your appointment has been rescheduled.",
  });

  // update session slotId
  await sessionController.updateSessionSlot(newSlot._id);

  res.status(200).json({
    status: "success",
    message: "Slot booking rescheduled successfully",
    data: {
      newSlot,
    },
  });
});

/**
 * Assign a slot to a leader or volunteer
 */
exports.assignSlot = asyncHandler(async (req, res, next) => {
  const parsedStartDateTime = new Date(req.body.startDateTime);
  const parsedEndDateTime = new Date(req.body.endDateTime);
  const leaderId = req.body.leaderId;
  const sessionId = req.body.sessionId;

  // check if leader exist
  const leader = await User.findOne({
    _id: leaderId,
    accountType: { $in: ["counsellor", "volunteer"] },
  });

  if (!leader) {
    return next(
      new AppError(
        "Cannot assign a session to a non counsellor or volunteer",
        400
      )
    );
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    return next(new AppError("Please create a session first", 400));
  }

  const existingSlot = await Slot.findOne({
    startDateTime: {
      $gte: parsedStartDateTime,
      $lt: parsedEndDateTime,
    },
    leader: leaderId,
  });

  if (existingSlot && existingSlot.status === "booked") {
    return next(
      new AppError("There is an appointement at that time already", 409)
    );
  }

  if (existingSlot && existingSlot.status === "available") {
    existingSlot.status = "booked";
    // existingSlot.bookedBy = req.user.id;
    existingSlot.bookedAt = Date.now();
    existingSlot.user = req.body.userId;
    existingSlot.startDateTime = parsedStartDateTime;
    existingSlot.endDateTime = parsedEndDateTime;

    await existingSlot.save();
    await scheduleNotifications(req, existingSlot);
  } else {
    // create a new slot for the leader
    const slot = await Slot.create({
      leader: leaderId,
      startDateTime: parsedStartDateTime,
      endDateTime: parsedEndDateTime,
      status: "booked",
      createdBy: req.user.id,
      // bookedBy: req.user.id,
      bookedAt: Date.now(),
      user: req.body.userId,
    });

    await slot.save();

    await scheduleNotifications(req, slot);
  }

  await sessionController.assignSession(req.body);

  // You can perform any additional logic here, such as sending notifications

  res.status(200).json({
    status: "success",
    message: "Slot assigned successfully",
  });
});

/**
 * Get all of a counsellor's free, future slots
 */
exports.getCounsellorFreeSlots = asyncHandler(async (req, res, next) => {
  const currentDate = new Date();

  const allSlots = await Slot.find({
    startDateTime: { $gte: currentDate },
    counsellor: req.params.id,
    status: "available"
  });

  // Format slots- put times on the same date in an array
  const availableSlots = allSlots.reduce((accumulator, slot) => {
    if (accumulator[slot.date]) {
      accumulator[slot.date].timeSlots.push({ id: slot._id, time: slot.startDateTime })
    } else {
      accumulator[slot.date] = {
        date: slot.date,
        timeSlots: [],
      }
    }
    return accumulator;
  }, {})
  res.status(200).json({ availableSlots });
})


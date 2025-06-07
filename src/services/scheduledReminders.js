const cron = require("node-cron");
const Sessions = require("../models/v1/Session");
const Users = require("../models/v1/User");
const mailNotificationService = require("./mailNotificationService");
const { PushNotification } = require("./pushNotifications");

const task = cron.schedule("*/1 * * * *", async () => {
    // Date parameter
    const now = new Date();
    const oneHour = new Date();
    oneHour.setHours(oneHour.getHours() + 1);

    // Fetch sessions
    const fetchedSessions = await Sessions.find({
        startTime: { $gte: now, $lte: oneHour },
        status: "approved",
    });
    if (fetchedSessions.length == 0) return;

    fetchedSessions.forEach(async (session) => {
        const time = timeDifference(session.startTime);
        if (!time) return; // The session Does not fall in the range
        // Date format
        // Get user
        const user = await Users.findOne({ _id: session.user });
        if (user) {
            sendPushNotification(user, time);
            sendEmailNotification(user, session.startTime.toString());
        }
        // Get Counsellor
        const counsellor = await Users.findOne({ _id: session.counsellor });
        if (counsellor) {
            sendPushNotification(counsellor, time);
            sendEmailNotification(counsellor, session.startTime.toString());
        }
    });
});

const sendPushNotification = (receiver, time) => {
    const { notificationSettings, pushToken } = receiver;
    if (
        notificationSettings &&
        notificationSettings.mobilePushNotifications &&
        pushToken
    ) {
        PushNotification.sendPushNotification([
            {
                pushToken: pushToken,
                body: `You have a session scheduled in ${time}`,
            },
        ]);
    }
};

const sendEmailNotification = (receiver, startTime) => {
    const { email, name, notificationSettings } = receiver;
    if (
        notificationSettings &&
        notificationSettings.mobilePushNotifications &&
        email
    ) {
        mailNotificationService.sendMail({
            recipient: email,
            subject: "Session Reminder",
            html: `<p>Dear ${name || ""},</p>
          <p>This is a reminder of your session that is scheduled with at ${startTime}.</p>
          <br />
          <p>Thank you</p>
          <p>Positiveo</p>`,
        });
    }
};
const timeDifference = (time) => {
    const difference = time - Date.now();
    const hour = 3600; // Seconds
    const remaining = difference / hour / 1000;
    if (remaining > 0.99) {
        return "1 Hour";
    } else if (0.09 < remaining <= 0.1) {
        return "10 Minutes";
    } else if (0.005 < remaining <= 0.01) {
        return "1 Minute";
    } else {
        return null;
    }
};

module.exports = task;

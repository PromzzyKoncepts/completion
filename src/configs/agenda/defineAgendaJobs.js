/* eslint-disable no-unused-vars */
const Slot = require("../../models/v2/Slot");
const User = require("../../models/v2/User_");
const MailNotificationService = require("../../services/mailNotificationService");

module.exports = function (agenda) {
    agenda.define("create new slot", async (job) => {
        const { leader, startTime, endTime, repeats } =
            job.attrs.data;
        // const parentSlotExpiresAt = Slot.findById(parentSlot).expiresAt;

        let repeatInterval;

        switch (repeats) {
            case "daily":
                repeatInterval = 1;
                break;
            case "workingDays":
                repeatInterval = 1;
                break;
            case "weekly":
                repeatInterval = 7;
                break;
            case "biweekly":
                repeatInterval = 14;
                break;
            case "monthly":
                repeatInterval = 30;
                break;
            default:
                repeatInterval = 0;
        }

        for (let i = 0; i < repeatInterval; i++) {
            const slotStartTime = new Date(
                new Date(startTime).getTime() +
                    repeatInterval * i * 24 * 60 * 60 * 1000
            );

            const slotEndTime = new Date(
                new Date(endTime).getTime() +
                    repeatInterval * i * 24 * 60 * 60 * 1000
            );

            // if greater than parent slot expiresAt stop creating slots
            // if (parentSlotExpiresAt && slotStartTime > parentSlotExpiresAt) {
            //     break;
            // }

            // Ensure we're not scheduling for weekends if repeats is set to workingDays
            // if (repeats === "workingDays") {
            //     while (
            //         slotStartTime.getDay() === 0 ||
            //         slotStartTime.getDay() === 6
            //     ) {
            //         slotStartTime.setDate(slotStartTime.getDate() + 1);
            //         slotEndTime.setDate(slotEndTime.getDate() + 1);
            //     }
            // }

            await Slot.create({
                leader,
                startTime: slotStartTime,
                endTime: slotEndTime,
                // slotId: `${leader}-${slotStartTime.toISOString()}-${slotEndTime.toISOString()}`,
                repeats,
                jobId: job.attrs._id,
                // parentSlot,
            });
        }
    });

    agenda.define("remind a minute before", async (job) => {
        const { userId, leaderId, message } = job.attrs.data;

        const user = await User.findById(userId);
        const leader = await User.findById(leaderId);

        if (
            user.notificationSettings.emailSessionReminders &&
            user.notificationSettings.emailSessionReminders.aMinuteBefore
        ) {
            await MailNotificationService.sendMail({
                recipient: user.email,
                subject: "Session Reminder",
                html: `<p>Dear ${user.name || ""},</p>
                <p>${message}</p>
                <br />
                <p>Thank you</p>
                <p>Positiveo</p>`,
            });
        }

        if (
            leader.notificationSettings.emailSessionReminders &&
            leader.notificationSettings.emailSessionReminders.aMinuteBefore
        ) {
            await MailNotificationService.sendMail({
                recipient: leader.email,
                subject: "Session Reminder",
                html: `<p>Dear ${leader.name || ""},</p>
                <p>${message}</p>
                <br />
                <p>Thank you</p>
                <p>Positiveo</p>`,
            });
        }
    });

    agenda.define("remind a day before", async (job) => {
        const { userId, leaderId, message } = job.attrs.data;

        const user = User.findById(userId);

        const leader = User.findById(leaderId);

        if (
            user.notificationSettings.emailSessionReminders &&
            user.notificationSettings.emailSessionReminders.aDayBefore
        ) {
            await MailNotificationService.sendMail({
                recipient: user.email,
                subject: "Session Reminder",
                html: `<p>Dear ${user.name || ""},</p>
                <p>${message}</p>
                <br />
                <p>Thank you</p>
                <p>Positiveo</p>`,
            });
        }

        if (
            leader.notificationSettings.emailSessionReminders &&
            leader.notificationSettings.emailSessionReminders.aDayBefore
        ) {
            await MailNotificationService.sendMail({
                recipient: leader.email,
                subject: "Session Reminder",
                html: `<p>Dear ${leader.name || ""},</p>
                <p>${message}</p>
                <br />
                <p>Thank you</p>
                <p>Positiveo</p>`,
            });
        }
    });

    agenda.define("remind an hour before", async (job) => {
        const { userId, leaderId, message } = job.attrs.data;

        const user = User.findById(userId);
        const leader = User.findById(leaderId);

        if (
            user.notificationSettings.emailSessionReminders &&
            user.notificationSettings.emailSessionReminders.anHourBefore
        ) {
            await MailNotificationService.sendMail({
                recipient: "a.sani@alustudent.com",
                subject: "Session Reminder",
                html: `<p>Dear ${user.name || ""},</p>
                <p>${message}</p>
                <br />
                <p>Thank you</p>
                <p>Positiveo</p>`,
            });
        }

        if (
            leader.notificationSettings.emailSessionReminders &&
            leader.notificationSettings.emailSessionReminders.anHourBefore
        ) {
            await MailNotificationService.sendMail({
                recipient: leader.email,
                subject: "Session Reminder",
                html: `<p>Dear ${leader.name || ""},</p>
                <p>${message}</p>
                <br />
                <p>Thank you</p>
                <p>Positiveo</p>`,
            });
        }
    });

    // Add more job definitions as needed...
};

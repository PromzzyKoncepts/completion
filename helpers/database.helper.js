const Session = require("../models/Session");
const User = require("../models/User");
const { Time } = require("../utils/time.utils");
const mongoose = require("mongoose");
const AppLogger = require("../src/middlewares/logger/logger")
module.exports = class DatabaseHelper {
    /**
     * Retrieves a list of available counselors matching the specified parameters.
     * @param {string} requestedSessionCategoryId - The string representation of the ObjectId of the session category.
     * @param {string} requestedSessionGender - The gender of the requesting user
     * @param {string} startTime - The start time as a date string with timezone info.
     * @param {string} endTime - The end time as a date string with timezone info.
     * @returns {List<User>} - The list of counsellors
     */
    static async getAvailableCounselorsForUser(
        requestedSessionCategoryId,
        requestedSessionGender,
        startTime,
        endTime
    ) {
        requestedSessionGender = requestedSessionGender || "both"; // whatever placeholder used for catchall
        const requestedSessionStartDateTime = new Date(startTime);
        // TODO: Handle possible bugs resulting from GMT to Local Timezone inconcistencies.
        const requestedSessionEndDateTime = new Date(endTime);

        const weekDays = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
        ];
        const requestedSessionWeekDay =
            weekDays[requestedSessionStartDateTime.getUTCDay()];
        const hoursStart = requestedSessionStartDateTime.getUTCHours();
        const minutesStart = requestedSessionStartDateTime.getUTCMinutes();
        const minutesPaddedStart =
            minutesStart < 10 ? `0${minutesStart}` : minutesStart;
        const requestedStartTime = Number(`${hoursStart}${minutesPaddedStart}`);
        // TODO: May need this for better handling of availability.
        // const hoursEnd = requestedSessionEndDateTime.getUTCHours();
        // const minutesEnd = requestedSessionEndDateTime.getUTCMinutes();
        // const minutesPaddedEnd = minutesEnd < 10 ? `0${minutesEnd}` : minutesEnd;
        // const requestedEndTime = Number(`${hoursEnd}${minutesPaddedEnd}`);

        let counsellorGenderFlexibility = [];

        if (requestedSessionGender == "male") {
            counsellorGenderFlexibility = [
                { "sessionPreferences.gender": "male" },
                { "sessionPreferences.gender": "both" },
            ];
        } else if (requestedSessionGender == "female") {
            counsellorGenderFlexibility = [
                { "sessionPreferences.gender": "female" },
                { "sessionPreferences.gender": "both" },
            ];
        } else {
            // TODO: BOTH should be changed to a better catch-all like "any".
            // This would send a non-binary user to someone who thought they would get male/female.
            counsellorGenderFlexibility = [
                { "sessionPreferences.gender": "both" },
            ];
        }
        let counsellorsQuery;
        const bufferedRequestStartTime = new Time(requestedStartTime);
        // Make sure there are at least 30 minutes before the counsellor availability to avoid assigning counsellor without preparation time.
        const requestedSessionMinutesFromNow =
            (requestedSessionStartDateTime - new Date()) / (1000 * 60);
        const preparationTime = 30;
        if (requestedSessionMinutesFromNow < preparationTime) {
            bufferedRequestStartTime.addMinutes(
                preparationTime - requestedSessionMinutesFromNow
            );
        }
        if (requestedSessionCategoryId) {
            counsellorsQuery = {
                accountType: "counsellor",
                $or: counsellorGenderFlexibility,
                "sessionPreferences.preferredFields": {
                    $in: [mongoose.Types.O(requestedSessionCategoryId)],
                },
                [`sessionPreferences.workDays.${requestedSessionWeekDay}.startTime`]:
                {
                    $gte: bufferedRequestStartTime.timeInt,
                },
            };
        } else {
            counsellorsQuery = {
                accountType: "counsellor",
                $or: counsellorGenderFlexibility,
                [`sessionPreferences.workDays.${requestedSessionWeekDay}.startTime`]:
                {
                    $gte: requestedStartTime,
                },
            };
        }
        const counsellors = await User.find(counsellorsQuery);

        // Remove counsellors with existing scheduled session at this time
        const bufferTime = 30 * 60 * 1000; // 30 minutes in milliseconds
        //TODO: this avoid going past a day, but better buffer handling would help.
        // Goes hand in hand with allowing cross-UTC-day sessions.

        const requestedStartDateTimeBuffered = new Date(
            requestedSessionStartDateTime.getTime() - bufferTime
        );
        const requestedEndDateTimeBuffered = new Date(
            requestedSessionEndDateTime.getTime() + bufferTime
        );

        // TODO: Remove cancelled sessions from results /might use the status field
        const busyCounsellorsSessions = await Session.find({
            // this means their existing session would be active at the time this requested session should start
            $and: [
                { startTime: { $gte: requestedStartDateTimeBuffered } },
                { startTime: { $lte: requestedEndDateTimeBuffered } },
            ],
            counsellor: {
                $in: counsellors.map((counsellor) => counsellor._id),
            },
        });

        // TODO: handle cases when the time interval in the query above is too large.
        // In that case, we can get the sessions by ignoring the end times,
        // check if we can fit in another session when the counsellor would be available
        // If yes, assign that time interval to this new request
        // retain only counsellors who are not busy at the requested timeframe.
        const availableCounsellors = counsellors.filter(
            (counsellor) =>
                busyCounsellorsSessions.findIndex(
                    (item) => String(item.counsellor) === String(counsellor._id)
                ) == -1
        );

        try {
            availableCounsellors.sort(
                DatabaseHelper.sortBasedOnClosestCounsellorSession(
                    requestedSessionWeekDay,
                    requestedStartTime
                )
            );
        } catch (error) {
            AppLogger.error(error);
        }

        return availableCounsellors;
    }

    static sortBasedOnClosestCounsellorSession(targetDay, startTime) {
        return (counsellorA, counsellorB) => {
            const counsellorASessions = counsellorA.sessionPreferences.workDays[
                targetDay
            ].sort(DatabaseHelper.sortDaySessionsInAscendingOrder);
            const counsellorBSessions = counsellorB.sessionPreferences.workDays[
                targetDay
            ].sort(DatabaseHelper.sortDaySessionsInAscendingOrder);

            // This does not take into account that the closest session may be 'unavailable at the moment',
            // TODO: Filter out busy session before sorting using this method.
            const closestASession =
                counsellorASessions[
                counsellorASessions.findIndex(
                    (session) => session.startTime > startTime
                )
                ];
            const closestBSession =
                counsellorBSessions[
                counsellorBSessions.findIndex(
                    (session) => session.startTime > startTime
                )
                ];
            return closestASession.startTime - closestBSession.startTime;
        };
    }

    static sortDaySessionsInAscendingOrder(sessionA, sessionB) {
        return sessionA.startTime - sessionB.startTime;
    }
};

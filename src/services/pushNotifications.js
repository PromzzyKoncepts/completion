
const admin = require("../services/firebase");  // Import the Firebase configuration
const AppLogger = require("../middlewares/logger/logger");

class PushNotification {
    static async sendPushNotification(notificationData = []) {
        const messages = [];

        for (const {
            pushToken,
            body = "New notification",
            title = "Positiveo",
            data,
        } of notificationData) {
            // Firebase notification message
            const message = {
                notification: {
                    title,
                    body,
                },
                data: data || {},
                token: pushToken,
            };

            messages.push(message);
        }

        // Send notifications using Firebase
        try {
            const promises = messages.map(message => admin.messaging().send(message));
            const response = await Promise.all(promises);
        } catch (error) {
            AppLogger.error(error);
        }
    }
}

module.exports = { PushNotification };


// const { Expo } = require("expo-server-sdk");
//
// class PushNotification {
//     static sendPushNotification(notificationData = []) {
//         // Create a new Expo SDK client
//         // optionally providing an access token if you have enabled push security
//         const expo = new Expo();
//
//         // Create the messages that you want to send to clients
//         const messages = [];
//         for (const {
//             pushToken,
//             body = "New notification",
//             title = "Positiveo",
//             data,
//         } of notificationData) {
//             // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
//
//             // Check that all your push tokens appear to be valid Expo push tokens
//             if (!Expo.isExpoPushToken(pushToken)) {
//                 console.error(
//                     `Push token ${pushToken} is not a valid Expo push token`
//                 );
//                 continue;
//             }
//
//             // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
//             messages.push({
//                 to: pushToken,
//                 sound: "default",
//                 title,
//                 body,
//                 data,
//             });
//         }
//         const chunks = expo.chunkPushNotifications(messages);
//         const tickets = [];
//         (async () => {
//             for (const chunk of chunks) {
//                 try {
//                     const ticketChunk = await expo.sendPushNotificationsAsync(
//                         chunk
//                     );
//                     tickets.push(...ticketChunk);
//                 } catch (error) {
//                     console.error(error);
//                 }
//             }
//         })();
//
//         const receiptIds = [];
//         for (const ticket of tickets) {
//             if (ticket.id) {
//                 receiptIds.push(ticket.id);
//             }
//         }
//
//         const receiptIdChunks =
//             expo.chunkPushNotificationReceiptIds(receiptIds);
//         (async () => {
//             for (const chunk of receiptIdChunks) {
//                 try {
//                     const receipts =
//                         await expo.getPushNotificationReceiptsAsync(chunk);
//                     for (const receiptId in receipts) {
//                         const { status, message, details } =
//                             receipts[receiptId];
//                         if (status === "ok") {
//                             continue;
//                         } else if (status === "error") {
//                             console.error(
//                                 `There was an error sending a notification: ${message}`
//                             );
//                             if (details && details.error) {
//                                 console.error(
//                                     `The error code is ${details.error}`
//                                 );
//                             }
//                         }
//                     }
//                 } catch (error) {
//                     console.error(error);
//                 }
//             }
//         })();
//     }
// }
//
// module.exports = { PushNotification };

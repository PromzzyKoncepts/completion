const TopicSubscription = require("../models/v1/TopicSubscription");
const { PushNotification } = require("./pushNotifications");

class TopicService {
    static async mapSubscriptions(topic, user) {
        const subscription = await TopicSubscription.findOne({
            topic,
            user,
        }).lean();

        return subscription;
    }

    static async notifySubscribersService(topic, user) {
        const subscribers = await TopicSubscription.find({
            topic,
        })
            .select("user topic")
            .populate("user", "name pushToken")
            .populate("topic", "title")
            .lean();
        const notificationData = subscribers
            .filter((subscriber) => {
                return subscriber?.user?._id !== user;
            })
            .map((el) => ({
                title: "Comment added",
                body: `new comment for the topic: ${el.topic.title}`,
                pushToken: el?.user?.pushToken ?? "",
            }));
        PushNotification.sendPushNotification(notificationData);
    }
}

module.exports = { TopicService };

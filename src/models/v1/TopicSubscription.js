const mongoose = require("mongoose");

const topicSubscriptionSchema = new mongoose.Schema({
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subscribedOn: { type: Date, default: Date.now },
    shouldNotify: { type: Boolean, default: true },
});

module.exports = mongoose.model("TopicSubscription", topicSubscriptionSchema);

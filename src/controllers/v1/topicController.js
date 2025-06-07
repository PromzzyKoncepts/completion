const { ObjectId } = require("mongoose").Types;
const Comment = require("../../models/v1/Comment");
const Topic = require("../../models/v1/Topic");
const TopicCategories = require("../../models/v1/TopicCategories");
const TopicSubscription = require("../../models/v1/TopicSubscription");
const { TopicService } = require("../../services/topicsService");
const User = require("../../models/v1/User");

class TopicController {
    static async createTopic(req, res) {
        await Topic.create(
            { ...req.body, author: req.user.id },
            async (err, topic) => {
                if (err) {
                    return res.status(400).send({
                        status: "error",
                        message: "Sorry an error occurred. Please try again",
                    });
                }
                const category = await TopicCategories.findOne({
                    _id: req.body.category,
                });
                category.topic_count = category.topic_count
                    ? category.topic_count + 1
                    : 1;
                await category.save();
                const newTopic = await Topic.findOne({ _id: topic._id })
                    .populate("author", "name profilePicture")
                    .select("-likes");
                res.send({
                    status: "success",
                    message: "Post was created successfully",
                    data: newTopic,
                });
            }
        );
        // res.send({ user: req.user });
    }

    static async fetchTopics(req, res) {
        const { top, category } = req.query;
        const queryParams = { lastUpdated: -1 };
        const filter = {};
        if (top) queryParams["commentCount"] = top;
        if (category) filter["category"] = category;

        await Topic.find(filter)
            .sort(queryParams)
            .populate("author", "name _id")
            .populate("category", "code name color_code")
            .lean({ virtuals: true })
            .exec(async (err, topics) => {
                if (err) {
                    return res.status(400).send({
                        status: "error",
                        message:
                            "Sorry an error occurred while processing your request. Please check your connection and try again",
                    });
                } else {
                    topics = await Promise.all(
                        topics.map(async function (topic) {
                            const topicIsLiked = topic.likes
                                ? topic.likes.find(
                                      (item) => item.toString() === req.user.id
                                  )
                                : false;
                            const isSubscribed =
                                await TopicService.mapSubscriptions(
                                    topic._id,
                                    ObjectId(req.user.id)
                                );
                            topic.isSubscribed = isSubscribed ? true : false;
                            topic.isLiked = topicIsLiked ? true : false;
                            const { likes, ...rest } = topic;
                            return rest;
                        })
                    );
                    res.send({
                        status: "success",
                        message: "Successfully fetched topics",
                        data: topics,
                    });
                }
            });
    }

    static async fetchComments(req, res) {
        const { topicId } = req.params;
        await Comment.find({ topic: topicId })
            .sort({ lastUpdated: -1 })
            .populate("commentAuthor", "name")
            .populate("replies.commentAuthor", "name")
            .lean()
            .exec((err, comments) => {
                if (err) {
                    return res.status(300).send({
                        status: "error",
                        message:
                            "Sorry, we are having difficulties processing your request. Please check your connection and try again",
                    });
                }
                comments = comments.map(function (comment) {
                    const commentIsLiked = comment.likes
                        ? comment.likes.find(
                              (item) => item.toString() === req.user.id
                          )
                        : false;
                    comment.isLiked = commentIsLiked ? true : false;
                    comment.replies.map((reply) => {
                        const commentIsReplied = reply.likes
                            ? reply.likes.find(
                                  (item) => item.toString() === req.user.id
                              )
                            : false;
                        reply.isLiked = commentIsReplied ? true : false;
                        return reply;
                    });
                    const { likes, ...rest } = comment;
                    return rest;
                });

                return res.send({
                    status: "success",
                    data: comments,
                });
            });
    }

    static async addComment(req, res) {
        const body = {
            ...req.body,
            commentAuthor: req.user.id,
            topic: req.params.topic,
        };
        await Comment.create(body, async (err, comment) => {
            if (err) {
                return res.status(300).send({
                    status: "error",
                    message:
                        "Sorry, an error occurred processing your request.Please check your connection and try again",
                });
            }
            const topic = await Topic.findOne({ _id: req.params.topic });
            topic.commentCount = topic.commentCount
                ? topic.commentCount + 1
                : 1;
            await topic.save();
            await TopicSubscription.findOne(
                {
                    topic: req.params.topic,
                    user: req.user.id,
                },
                async (err, data) => {
                    let subscription = data;
                    if (!data) {
                        subscription = new TopicSubscription();
                        subscription.topic = req.params.topic;
                        subscription.user = req.user.id;
                    }
                    subscription.shouldNotify = true;
                    await subscription.save();
                }
            );
            TopicService.notifySubscribersService(topic, req.user.id);
            return res.send({
                status: "success",
                message: "Your comment has been added successfully",
                data: comment,
            });
        });
    }

    static async addCommentReply(req, res) {
        const { comment, topic } = req.params;
        const body = {
            ...req.body,
            commentAuthor: req.user.id,
            topic,
            comment,
        };

        await Comment.findOne({ _id: comment }, async (err, result) => {
            if (err) {
                return res.status(404).send({
                    status: "error",
                    message: "Comment does not exist",
                });
            } else {
                result.replies.push(body);
                await result.save();
                const reply = result.replies[result.replies.length - 1];
                const topic = await Topic.findOne({ _id: req.params.topic });
                topic.commentCount = topic.commentCount
                    ? topic.commentCount + 1
                    : 1;
                await topic.save();
                await TopicSubscription.findOne(
                    {
                        topic: req.params.topic,
                        user: req.user.id,
                    },
                    async (err, data) => {
                        let subscription = data;
                        if (!data) {
                            subscription = new TopicSubscription();
                            subscription.topic = req.params.topic;
                            subscription.user = req.user.id;
                        }
                        subscription.shouldNotify = true;
                        await subscription.save();
                    }
                );
                res.send({
                    status: "success",
                    message: "Reply has been added",
                    data: reply,
                });
            }
        });
    }

    static async pinTopic(req, res) {
        const findUser = await User.findOne({ _id: req.user.id });
        if (!ObjectId.isValid(req.body.topic)) {
            return res.status(300).send({
                status: "error",
                message: "Invalid information",
            });
        }
        if (findUser) {
            const topicExists = findUser.pinnedTopics.find(
                (el) => el.toString() === req.body.topic
            );
            if (topicExists) {
                // fake pin a post since the user has already pinned the post
                return res.send({
                    status: "success",
                    message: "This topic has been pinned successfully",
                });
            }
            findUser.pinnedTopics.push(req.body.topic);
            await findUser.save();
            return res.send({
                status: "success",
                message: "This topic has been pinned",
            });
        } else {
            return res.status(400).send({
                status: "error",
                message:
                    "Sorry, an error occurred. Please check your connection and try again",
            });
        }
    }

    static async unpinTopic(req, res) {
        const findUser = await User.findOne({ _id: req.user.id });
        if (!ObjectId.isValid(req.body.topic)) {
            return res.status(400).send({
                status: "error",
                message: "Invalid information. Request failed",
            });
        }
        if (findUser) {
            findUser.pinnedTopics.pull(req.body.topic);
            await findUser.save();
            return res.send({
                status: "success",
                message: "Topic unpinned successfully",
            });
        } else {
            return res.send({
                status: "success",
                message:
                    "Sorry, an error occurred. Please check your connection and try again",
            });
        }
    }
    // Duplicated function: commenting one of them before we figure out why
    /*static async likeTopic(req, res) {
        const findTopic = await Topic.findOne({ _id: req.body.topic });
        if (!findTopic) {
            return res.status(404).send({
                status: "error",
                message: "Invalid information. Please try again",
            });
        }
        const userExists = findTopic.likes.find(
            (el) => el.toString() === req.user.id
        );
        if (userExists) {
            // fake like a post since the user has already liked the post
            return res.send({
                status: "success",
                message: "You liked this post",
            });
        }
        findTopic.likes.push(req.user.id);
        await findTopic.save();
        return res.send({
            status: "success",
            message: "You liked this post",
        });
    }*/

    static async likeTopic(req, res) {
        const findTopic = await Topic.findOne({ _id: req.body.topic });
        if (!findTopic) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information. Please check connection and try again",
            });
        }
        const userExists = findTopic.likes.find(
            (el) => el.toString() === req.user.id
        );
        if (userExists) {
            // fake like a post since the user has already liked the post
            return res.send({
                status: "success",
                message: "You liked this post",
            });
        }
        findTopic.likes.push(req.user.id);
        await findTopic.save();
        return res.send({
            status: "success",
            message: "You liked this post",
        });
    }

    static async unlikeTopic(req, res) {
        const findTopic = await Topic.findOne({ _id: req.body.topic });
        if (!findTopic) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information. Please check connection and try again",
            });
        }
        const userExists = findTopic.likes.find(
            (el) => el.toString() === req.user.id
        );
        if (!userExists) {
            // fake like a post since the user has already liked the post
            return res.send({
                status: "success",
                message: "You unliked this post",
            });
        }
        findTopic.likes.pull(req.user.id);
        await findTopic.save();
        return res.send({
            status: "success",
            message: "You unliked this post",
        });
    }

    static async likeComment(req, res) {
        if (!ObjectId.isValid(req.body.comment)) {
            return res
                .status(404)
                .send({ status: "error", message: "Invalid information" });
        }
        const findComment = await Comment.findOne({ _id: req.body.comment });
        if (!findComment) {
            return res.status(404).send({
                status: "error",
                message: "Invalid information. please try again",
            });
        }

        const userExists = findComment.likes.find(
            (el) => el.toString() === req.user.id
        );
        if (userExists) {
            // fake like a post since the user has already liked the post
            return res.send({
                status: "success",
                message: "You liked a comment",
            });
        }
        findComment.likeCount = findComment.likeCount
            ? findComment.likeCount + 1
            : 1;
        findComment.likes.push(req.user.id);
        await findComment.save();
        return res.send({
            status: "success",
            message: "You liked a comment",
        });
    }

    static async unlikeComment(req, res) {
        if (!ObjectId.isValid(req.body.comment)) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information. please check your connection and try again",
            });
        }
        const findComment = await Comment.findOne({ _id: req.body.comment });
        if (!findComment) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information. please check your connection and try again",
            });
        }

        const userExists = findComment.likes.find(
            (el) => el.toString() === req.user.id
        );
        if (!userExists) {
            return res.send({
                status: "success",
                message: "You unliked a comment",
            });
        }
        findComment.likeCount = findComment.likeCount
            ? findComment.likeCount - 1
            : 1;
        findComment.likes.pull(req.user.id);
        await findComment.save();
        return res.send({
            status: "success",
            message: "You unliked a comment",
        });
    }

    static async likeCommentReply(req, res) {
        if (
            !ObjectId.isValid(req.body.comment) ||
            !ObjectId.isValid(req.body.reply)
        ) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information. please check your connection and try again",
            });
        }
        const findComment = await Comment.findOne({ _id: req.body.comment });
        if (!findComment) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information, please check your connection and try again",
            });
        }

        const replyIndex = findComment.replies.findIndex(
            (el) => el._id.toString() === req.body.reply
        );
        
        if (replyIndex < 0) {
            return res.send({
                status: "error",
                message:
                    "An error occurred, please check your connection and try again",
            });
        }
        const userExists = findComment.replies[replyIndex].likes.find(
            (el) => el.toString() === req.user.id
        );
        if (userExists) {
            // fake like a post since the user has already liked the post
            return res.send({
                status: "success",
                message: "You liked a reply",
            });
        }
        findComment.replies[replyIndex].likeCount = findComment.replies[
            replyIndex
        ].likeCount
            ? findComment.replies[replyIndex].likeCount + 1
            : 1;
        findComment.replies[replyIndex].likes.push(req.user.id);
        await findComment.save();
        return res.send({
            status: "success",
            message: "You liked a reply",
        });
    }

    static async unlikeCommentReply(req, res) {
        if (
            !ObjectId.isValid(req.body.comment) ||
            !ObjectId.isValid(req.body.reply)
        ) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information, please check your connection and try again",
            });
        }
        const findComment = await Comment.findOne({ _id: req.body.comment });
        if (!findComment) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information, please check your connection and try again",
            });
        }

        const replyIndex = findComment.replies.findIndex(
            (el) => el._id.toString() === req.body.reply
        );
    
        if (replyIndex < 0) {
            return res.send({
                status: "error",
                message:
                    "Invalid information, please check your connection and try again",
            });
        }
        const userExists = findComment.replies[replyIndex].likes.find(
            (el) => el.toString() === req.user.id
        );
        if (!userExists) {
            // fake like a post since the user has already liked the post
            return res.send({
                status: "success",
                message: "You unliked a reply",
            });
        }
        findComment.replies[replyIndex].likeCount = findComment.replies[
            replyIndex
        ].likeCount
            ? findComment.replies[replyIndex].likeCount - 1
            : 0;
        findComment.replies[replyIndex].likes.pull(req.user.id);
        await findComment.save();
        return res.send({
            status: "success",
            message: "You unliked a reply",
        });
    }

    static async leaveConversation(req, res) {
        if (!req.params.topic || !ObjectId.isValid(req.params.topic)) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information, please check your connection and try again",
            });
        }
        await TopicSubscription.findOneAndDelete(
            {
                topic: req.params.topic,
                user: req.user.id,
            },
            (err, data) => {
                if (err) {
                    return res.status(400).send({
                        status: "error",
                        message:
                            "Sorry an error occurred. Please check your connection and try again",
                    });
                } else {
                    return res.send({
                        status: "success",
                        message:
                            "You have successfully exited this conversation",
                    });
                }
            }
        );
    }

    static async joinConversation(req, res) {
        if (!req.params.topic || !ObjectId.isValid(req.params.topic)) {
            return res.status(404).send({
                status: "error",
                message:
                    "Invalid information. please check your connection and try again",
            });
        }
        await TopicSubscription.findOne(
            {
                topic: req.params.topic,
                user: req.user.id,
            },
            async (err, data) => {
                if (err) {
                    return res.status(400).send({
                        status: "error",
                        message:
                            "Invalid information, please check your connection and try again",
                    });
                } else {
                    let subscription = data;
                    if (!data) {
                        subscription = new TopicSubscription();
                        subscription.topic = req.params.topic;
                        subscription.user = req.user.id;
                    }
                    subscription.shouldNotify = true;
                    await subscription.save();
                    return res.send({
                        status: "success",
                        message:
                            "Success. You have now subscribed to this conversation",
                    });
                }
            }
        );
    }
}

module.exports = { TopicController };

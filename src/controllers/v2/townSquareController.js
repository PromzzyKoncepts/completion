const asyncHandler = require("../../middlewares/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const { PushNotification } = require("../../services/pushNotifications");
const ConvoComment = require("../../models/v2/ConvoComment");
const Convo = require("../../models/v2/Convo");
const Topic = require("../../models/v2/Topic");
const ReportUser = require("../../models/v2/ReportUser");
const cloudinary = require("cloudinary").v2;
const AppLogger = require("../../middlewares/logger/logger");

exports.getTopics = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = {};

        // Fetch topics with pagination and populate category and author
        const topics = await Topic.find(query)
            .populate("author", "firstName lastName") // Populate author name
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean({ virtuals: true });

        // Count total topics
        const totalTopics = await Topic.countDocuments(query);

        // Return success response with topics and pagination info
        return ApiResponse.success(
            res,
            {
                topics,
                pagination: {
                    totalTopics,
                    currentPage: page,
                    totalPages: Math.ceil(totalTopics / limit),
                },
            },
            "Topics fetched successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error fetching topics");
    }
});

exports.getTopicDetails = asyncHandler(async (req, res) => {
    try {
        const { topicId } = req.params;
        const topic = await Topic.findById(topicId)
            .populate("author", "firstName lastName email profilePicture _id")
            .populate("likes", "firstName lastName email profilePicture _id")
            .populate(
                "participants",
                "firstName lastName email profilePicture _id created_at"
            );

        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        const convos = await Convo.find({
            topic: topicId,
        });

        const comments = await Promise.all(
            convos.map(async (convo) =>
                ConvoComment.countDocuments({ convo: convo.id })
            )
        );
        const replies = comments.reduce((a, b) => a + b, 0);
        const engagement =
            convos.reduce(
                (acc, convo) =>
                    Object.values(convo.reactions).reduce(
                        (total, reaction) => reaction.length + total,
                        0
                    ) + acc,
                0
            ) + replies;

        return ApiResponse.success(res, "success", {
            topic,
            convos: convos.length,
            replies,
            engagement,
        });
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Internal server error");
    }
});

exports.addTopic = asyncHandler(async (req, res, next) => {
    try {
        const { title } = req.body;

        // // Validate if the category exists
        // const topicCategory = await TopicCategory.findById(category);
        // if (!topicCategory) {
        //     return ApiResponse.failure(res, "Invalid category");
        // }

        const [topicExists] = await Topic.find({ title });

        if (topicExists) {
            return ApiResponse.error(res, "Topic already exists", 400);
        }

        // Create a new Topic document
        const newTopic = new Topic({
            ...req.body,
            // category,
            author: req.user.id,
            likes: [],
            commentCount: 0, // Initialize with 0 comments
            createdAt: new Date(),
            lastUpdated: new Date(),
        });

        // Save the new topic to the database
        await newTopic.save();

        return ApiResponse.success(res, newTopic, "Topic added successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error adding topic");
    }
});

exports.muteTopic = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const topic = await Topic.findById(id);
        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        if (topic.muted.includes(userId)) {
            return ApiResponse.error(
                res,
                "You have already muted this topic",
                400
            );
        }

        topic.muted.push(userId);
        await topic.save();

        return ApiResponse.success(res, null, "Topic muted successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error muting topic");
    }
});

exports.leaveTopic = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const topic = await Topic.findById(id);
        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        const userIndex = topic.participants.indexOf(userId);
        if (userIndex === -1) {
            return ApiResponse.error(
                res,
                "You are not a member of this topic",
                400
            );
        }

        topic.participants.splice(userIndex, 1);
        await topic.save();

        return ApiResponse.success(
            res,
            null,
            "You have left the topic successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error leaving topic");
    }
});

exports.joinTopic = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const topic = await Topic.findById(id);
        if (!topic) {
            return ApiResponse.error(res, "Topic not found", 404);
        }

        if (topic.participants.includes(userId)) {
            return ApiResponse.error(
                res,
                "You are already a member of this topic",
                400
            );
        }

        topic.participants.push(userId);
        await topic.save();

        return ApiResponse.success(
            res,
            null,
            "You have joined the topic successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error joining topic");
    }
});

exports.createConvo = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { topicId } = req.params;

        AppLogger.info(`[Convo Creation] User: ${userId} | Topic: ${topicId}`);

        const topicExists = await Topic.findById(topicId).lean();

        if (!topicExists) {
            AppLogger.warn(
                `[Convo Creation] Topic not found | Topic ID: ${topicId}`
            );
            return ApiResponse.error(res, "Topic not found", 404);
        }

        AppLogger.info(
            `[Convo Creation] Topic found | Title: ${
                topicExists.title || "Untitled"
            }`
        );

        const { type, body, title, imageUrl } = req.body;

        // Validate required fields manually
        if (!type || !["post", "question"].includes(type)) {
            return ApiResponse.error(
                res,
                "Invalid or missing convo type (post/question)",
                400
            );
        }

        if (!body || typeof body !== "string") {
            return ApiResponse.error(
                res,
                "Body is required and must be a string",
                400
            );
        }

        const convoPayload = {
            topic: topicId,
            createdBy: userId,
            type,
            body,
            title: title || null,
            imageUrl: imageUrl || null,
            participants: [userId], // You can modify this logic if needed
        };

        AppLogger.debug(
            `[Convo Creation] Payload: ${JSON.stringify(convoPayload, null, 2)}`
        );

        const convo = new Convo(convoPayload);
        await convo.save();

        AppLogger.info(
            `[Convo Creation] Convo created successfully | Convo ID: ${convo._id}`
        );

        return ApiResponse.success(res, convo, "Convo added successfully");
    } catch (error) {
        AppLogger.error(`[Convo Creation] Error: ${error.message}`, error);
        return ApiResponse.error(res, "Error adding Convo");
    }
});

exports.joinConvo = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const convoId = req.params.id;

        // Check if the convo exists
        const convo = await Convo.findById(convoId);
        if (!convo) {
            return ApiResponse.error(res, "Convo not found", 404);
        }

        // Check if the user is already a participant
        if (convo.participants.includes(userId)) {
            return ApiResponse.success(
                res,
                { convoId, participants: convo.participants },
                "Already joined convo"
            );
        }

        // Add the user to the participants list and increment views
        convo.participants.push(userId);
        convo.views += 1;
        await convo.save();

        return ApiResponse.success(
            res,
            { convoId, participants: convo.participants },
            "User joined convo successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error joining convo");
    }
});

exports.leaveConvo = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.id;
        const convoId = req.params.id;

        // Check if the convo exists
        const convo = await Convo.findById(convoId);
        if (!convo) {
            return ApiResponse.error(res, "Convo not found", 404);
        }

        // Check if the user is a participant
        if (!convo.participants.includes(userId)) {
            return ApiResponse.success(
                res,
                { convoId, participants: convo.participants },
                "User is not a participant"
            );
        }

        // Remove the user from the participants list
        convo.participants = convo.participants.filter(
            (participant) => participant.toString() !== userId
        );
        await convo.save();

        return ApiResponse.success(
            res,
            { convoId, participants: convo.participants },
            "User left convo successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Error leaving convo");
    }
});

// exports.reportConvo = asyncHandler(async (req, res, next) => {

//   try {
//     const convo = await Convo.findById(req.params.id);
//     if (!convo) return res.status(404).send("Convo not found");

//     // Increment the report count
//     convo.reportCount += 1;

//     // // Optionally store the report message if needed (you can create an array for this)
//     // if (reportMessage) {
//     //     // If you want to keep track of all messages, consider adding a field to the schema
//     //     // convo.reportMessages.push(reportMessage); // Uncomment this line if reportMessages array is added to the schema
//     // }

//     await convo.save(); // Save the updated convo

//     res.status(200).json({
//       message: "Convo reported successfully",
//       reportCount: convo.reportCount,
//     });
//   } catch (error) {
//     AppLogger.error(error);
//     res.status(500).send("Server error");
//   }
// });

exports.reportConvo = asyncHandler(async (req, res, next) => {
  try {
    const convoId = req.params.id;
    const reporterId = req.user.id;
    const { description, reportedUserRole } = req.body;

    const convo = await Convo.findById(convoId).lean();

    if (!convo) {
      AppLogger.warn(`[Report] Convo not found | ID: ${convoId}`);
      return ApiResponse.error(res, "Convo not found", 404);
    }

    if (!convo.createdBy) {
      AppLogger.error(`[Report] Convo has no creator | ID: ${convoId}`);
      return ApiResponse.error(res, "Convo has no creator to report", 400);
    }

    // ❗ Check if this user has already reported this convo
    const existingReport = await ReportUser.findOne({
      reportedBy: reporterId,
      reportedEntity: convoId,
      entityType: "Convo",
    });

    if (existingReport) {
      AppLogger.warn(
        `[Report] Duplicate report attempt by user ${reporterId} on convo ${convoId}`
      );
      return ApiResponse.error(res, "You have already reported this convo", 400);
    }

    // Create a new report
    const report = new ReportUser({
      reportedBy: reporterId,
      reportedEntity: convoId,
      entityType: "Convo",
      reportedUser: convo.createdBy,
      reportedUserRole,
      description,
    });

    await report.save();

    AppLogger.info(`[Report] Convo reported | Report ID: ${report._id}`);

    return ApiResponse.success(
      res,
      { reportId: report._id },
      "Convo reported successfully"
    );
  } catch (error) {
    AppLogger.error(`[Report] Error: ${error.message}`, error);
    return ApiResponse.error(res, "Server error", 500);
  }
});


exports.getConvos = asyncHandler(async (req, res, next) => {
    try {
        const { type, filter, topic } = req.query;

        // Build the query object
        const query = {};

        // Add type filter if provided
        if (type) {
            query.type = type;
        }

        // If topic is provided, filter by topic ID
        if (topic) {
            // query.topic = topic;
            const [userTopic] = await Topic.find({ title: topic });

            if (!userTopic) {
                return ApiResponse.error(res, "Topic does not exist", 404);
            }

            query.topic = userTopic._id;
        }

        // Fetch all conversations based on the constructed query
        let convos = await Convo.find(query)
            .populate("topic") // Populate the topic if needed
            .populate(
                "createdBy",
                "firstName lastName email profilePicture _id"
            )
            .populate(
                "participants",
                "firstName lastName email profilePicture _id created_at"
            )
            .sort({ createdAt: -1 }); // Default sort by recent (newest first)

        // Apply additional filtering based on filter type
        if (filter === "popular") {
            // Sort by views or report count for popularity
            convos.sort((a, b) => b.views - a.views);
        } else if (filter === "random") {
            // Shuffle the array for random selection
            convos = convos.sort(() => Math.random() - 0.5);
        }

        // Prepare total views and total convos for the response
        const totalViews = convos.reduce((acc, convo) => acc + convo.views, 0);
        const totalConvos = convos.length;

        // Return the fetched conversations along with total views and total convos
        res.status(200).json({
            message: "Convos fetched successfully",
            data: {
                totalViews,
                totalConvos,
                convos,
            },
        });
    } catch (error) {
        AppLogger.error(error);
        res.status(500).send("Server error");
    }
});

exports.getUserConvos = async (req, res) => {
    try {
        const { _id } = req.user;

        const convos = await Convo.find({
            $or: [{ participants: _id }, { createdBy: _id }],
        })
            .populate("topic") // Populate the topic if needed
            .populate(
                "createdBy",
                "firstName lastName email profilePicture _id"
            )
            .populate(
                "participants",
                "firstName lastName email profilePicture _id created_at"
            );

        return ApiResponse.success(res, convos, "success", 200);
    } catch (error) {
        AppLogger.error(error);
        ApiResponse.error(res, "Internal Server Error", 500);
    }
};

exports.addReaction = asyncHandler(async (req, res, next) => {
    try {
        const { reaction } = req.body;
        const userId = req.user.id;
        const convoId = req.params.id;

        // Find the conversation
        const convo = await Convo.findById(convoId);
        if (!convo) {
            return res.status(404).json({ message: "Convo not found" });
        }

        // Initialize the reaction type array if it doesn't exist
        if (!convo.reactions[reaction]) {
            convo.reactions[reaction] = [];
        }

        // Check if the user has already reacted
        const userReacted = convo.reactions[reaction].some(
            (id) => id.toString() === userId.toString()
        );

        if (userReacted) {
            // Remove the user's reaction if they already reacted
            convo.reactions[reaction] = convo.reactions[reaction].filter(
                (id) => id.toString() !== userId.toString()
            );
        } else {
            // Add the user's reaction if they haven't reacted yet
            convo.reactions[reaction].push(userId);
        }

        // Save updated convo
        await convo.save();

        return res.status(200).json({
            message: "Reaction updated successfully",
            reactions: convo.reactions,
        });
    } catch (error) {
        AppLogger.error(error);
        res.status(500).send("Server error");
    }
});

// Add comment to a conversation
exports.addComment = asyncHandler(async (req, res, next) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        const convoId = req.params.id;

        // Find the conversation to ensure it exists
        const convo = await Convo.findById(convoId);
        if (!convo) {
            return ApiResponse.failure(res, "Convo not found", 404);
        }

        // Check for duplicate comments
        const existingComment = await ConvoComment.findOne({
            convo: convoId,
            content,
            createdBy: userId,
        });

        if (existingComment) {
            return ApiResponse.failure(res, "Duplicate comment detected", 400);
        }

        // Create and save the new comment
        const comment = new ConvoComment({
            convo: convoId,
            content,
            createdBy: userId,
        });
        await comment.save();

        // Respond with the created comment using ApiResponse
        return ApiResponse.success(res, comment, "Comment added successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Server error", 500);
    }
});

exports.addReplyComment = asyncHandler(async (req, res, next) => {
    try {
        const { content, parentComment } = req.body; // Accept parentComment from the request
        const userId = req.user.id;
        const convoId = req.params.id;

        // Find the conversation to ensure it exists
        const convo = await Convo.findById(convoId);
        if (!convo) {
            return ApiResponse.failure(res, "Convo not found", 404);
        }

        // Check if the parent comment belongs to the same conversation
        if (parentComment) {
            const parent = await ConvoComment.findById(parentComment);
            if (!parent || parent.convo.toString() !== convoId) {
                return ApiResponse.failure(
                    res,
                    "Parent comment does not belong to this conversation",
                    400
                );
            }
        }

        // Check for duplicate comments
        const query = {
            convo: convoId,
            content,
            createdBy: userId,
        };

        if (parentComment) {
            // If parentComment is provided, we want to allow duplicate replies
            query.parentComment = parentComment;
        } else {
            // Ensure this is only for top-level comments
            query.parentComment = null;
        }

        const existingComment = await ConvoComment.findOne(query);

        if (existingComment) {
            return ApiResponse.failure(res, "Duplicate comment detected", 400);
        }

        // Create and save the new comment (reply if parentComment is provided)
        const comment = new ConvoComment({
            convo: convoId,
            content,
            createdBy: userId,
            parentComment: parentComment || null, // Set parentComment if provided
        });
        await comment.save();

        // Respond with the created comment using ApiResponse
        return ApiResponse.success(res, comment, "Comment added successfully");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Server error", 500);
    }
});

exports.getComments = asyncHandler(async (req, res, next) => {
    try {
        const convoId = req.params.id;

        // Find all comments related to the conversation and populate only the required user fields
        const comments = await ConvoComment.find({ convo: convoId }).populate({
            path: "createdBy",
            select: "id firstName lastName", // Select only user ID, first name, and last name
        });

        // Organize comments and replies
        const groupedComments = comments.reduce((acc, comment) => {
            const commentData = {
                ...comment.toObject(),
                replies: [],
                likesCount: comment.likes.length, // Include the likes count
            };

            if (!comment.parentComment) {
                // If it's a top-level comment, add it to the accumulator
                acc.push(commentData);
            } else {
                // If it's a reply, find the parent comment and add it to the replies array
                const parentComment = acc.find(
                    (c) => c._id.toString() === comment.parentComment.toString()
                );
                if (parentComment) {
                    parentComment.replies.push(commentData);
                }
            }
            return acc;
        }, []);

        // Respond with grouped comments
        return ApiResponse.success(
            res,
            groupedComments,
            "Comments retrieved successfully"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Server error", 500);
    }
});

exports.likeComment = asyncHandler(async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        // Find the comment by ID
        const comment = await ConvoComment.findById(commentId);
        if (!comment) {
            return ApiResponse.failure(res, "Comment not found", 404);
        }

        // Check if the user already liked the comment
        const alreadyLiked = comment.likes.includes(userId);

        if (alreadyLiked) {
            // If already liked, remove the user from likes
            comment.likes.pull(userId);
        } else {
            // If not liked, add the user to likes
            comment.likes.push(userId);
        }

        // Save the updated comment
        try {
            await comment.save();
        } catch (saveError) {
            AppLogger.error(error);
            return ApiResponse.error(res, "Unable to save comment", 500);
        }

        // Respond with the updated comment and a success message
        return ApiResponse.success(
            res,
            comment,
            alreadyLiked ? "Like removed" : "Comment liked"
        );
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Server error", 500);
    }
});

exports.getSquareVideos = async (req, res) => {
    try {
        const {
            CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET,
            CLOUDINARY_CLOUD_NAME,
        } = process.env;

        if (
            !CLOUDINARY_API_KEY ||
            !CLOUDINARY_API_SECRET ||
            !CLOUDINARY_CLOUD_NAME
        ) {
            return ApiResponse.error(res, "Credentials Not Provided", 400);
        }

        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
        });

        const result = await cloudinary.api.resources({
            type: "upload",
            resource_type: "video",
            max_results: 500,
            context: true,
        });

        return ApiResponse.success(res, result, "success");
    } catch (error) {
        AppLogger.error(error);
        return ApiResponse.error(res, "Internal server error", 500);
    }
};

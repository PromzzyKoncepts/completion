const asyncHandler = require("../../middlewares/asyncHandler");
const AppError = require("../../utils/appError");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const MailNotificationService = require("../../services/mailNotificationService");
const User = require("../../models/v2/Base");
const ReportUser = require("../../models/v2/ReportUser");
const Feedback = require("../../models/v2/UserFeedback");
const Topic = require("../../models/v2/Topic");
const Media = require("../../models/v2/Media");
const AppLogger = require("../../middlewares/logger/logger");
const Factory = require("../../utils/factory");
const ApiResponse = require("../../utils/ApiResponse");
const { FeaturedOrder } = require("../../models/v2/FeaturedMedia");


exports.createMedia = asyncHandler(async (req, res, next) => {
  try {

    const author = req.user.id;
    const { topicId } = req.params;

    const existingTopic = Topic.findById(topicId);

    if (!existingTopic) {
      return ApiResponse.error(res, "Topic not found", 404);
    }

    // Create a new media document
    const newMedia = new Media({
      ...req.body,
      topic: topicId,
      author
    });

    // Save the media document
    await newMedia.save();

    // Return success response with the created media
    return ApiResponse.success(res, newMedia, "Media created successfully");
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error creating media");
  }
});


// In your existing media controller
exports.getMedia = asyncHandler(async (req, res, next) => {
  try {
    const {
      category, // 'videos', 'articles', or 'featured'
      featuredType, // when category is 'featured', this can be 'video' or 'article'
      favorite,
      topic,
      sort,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    
    // Handle category filtering
    if (category) {
      if (category === "videos") {
        query.type = "video";
      } else if (category === "articles") {
        query.type = "article";
      } else if (category === "featured") {
        // Get featured media IDs
        const featuredQuery = {};
        if (featuredType && ["video", "article"].includes(featuredType)) {
          featuredQuery.type = featuredType;
        }
        
        const featuredItems = await FeaturedOrder.find(featuredQuery)
          .sort({ order: 1 })
          .select("media");
        
        const featuredIds = featuredItems.map(item => item.media);
        query._id = { $in: featuredIds };
      }
    }
    
    if (topic) query.topic = topic;

    if (favorite === "true" && req.user) {
      query._id = { $in: req.user.favorites };
    }

    const sortOption = {};
    if (sort === "recent") {
      sortOption.createdAt = -1;
    } else if (sort === "popular") {
      sortOption.likesCount = -1;
    }

    const mediaQuery = Media.find(query)
      .populate("topic", "title")
      .populate("author", "firstName lastName profilePicture");

    if (category !== "featured") {
      mediaQuery.sort(sortOption);
    }

    const mediaItems = await mediaQuery
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean({ virtuals: true });

    // For featured items, add order information
    if (category === "featured") {
      const featuredOrders = await FeaturedOrder.find({
        media: { $in: mediaItems.map(item => item._id) }
      });
      
      const orderMap = {};
      featuredOrders.forEach(item => {
        orderMap[item.media.toString()] = item.order;
      });
      
      mediaItems.forEach(item => {
        item.featuredOrder = orderMap[item._id.toString()];
      });
      
      // Sort by featured order
      mediaItems.sort((a, b) => a.featuredOrder - b.featuredOrder);
    }

    const totalMedia = await Media.countDocuments(query);

    return ApiResponse.success(
      res,
      {
        mediaItems,
        pagination: {
          totalMedia,
          currentPage: page,
          totalPages: Math.ceil(totalMedia / limit),
        },
      },
      "Media items fetched successfully"
    );
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error fetching media items");
  }
});

exports.addToFeatured = asyncHandler(async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const { type } = req.body;

    if (!["video", "article"].includes(type)) {
      return ApiResponse.error(res, "Invalid type. Must be 'video' or 'article'", 400);
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return ApiResponse.error(res, "Media not found", 404);
    }

    // Check if media is already featured
    const existingFeatured = await FeaturedOrder.findOne({ media: mediaId });
    if (existingFeatured) {
      return ApiResponse.error(res, "Media is already featured", 400);
    }

    // Get current max order for this type
    const maxOrderDoc = await FeaturedOrder.findOne({ type })
      .sort("-order")
      .limit(1);
    const newOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 1;

    const featuredItem = await FeaturedOrder.create({
      media: mediaId,
      order: newOrder,
      type
    });

    return ApiResponse.success(
      res,
      { featuredItem },
      "Media added to featured successfully"
    );
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error adding media to featured");
  }
});

// Remove media from featured
exports.removeFromFeatured = asyncHandler(async (req, res, next) => {
  try {
    const { mediaId } = req.params;

    const featuredItem = await FeaturedOrder.findOneAndDelete({ media: mediaId });
    if (!featuredItem) {
      return ApiResponse.error(res, "Media is not featured", 404);
    }

    // Reorder remaining items of the same type
    await FeaturedOrder.updateMany(
      { type: featuredItem.type, order: { $gt: featuredItem.order } },
      { $inc: { order: -1 } }
    );

    return ApiResponse.success(
      res,
      null,
      "Media removed from featured successfully"
    );
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error removing media from featured");
  }
});

// Update featured order
exports.updateFeaturedOrder = asyncHandler(async (req, res, next) => {
  try {
    const { mediaId } = req.params;
    const { newOrder } = req.body;

    if (typeof newOrder !== "number" || newOrder < 1) {
      return ApiResponse.error(res, "Invalid order value", 400);
    }

    const featuredItem = await FeaturedOrder.findOne({ media: mediaId });
    if (!featuredItem) {
      return ApiResponse.error(res, "Media is not featured", 404);
    }

    const currentOrder = featuredItem.order;
    const type = featuredItem.type;

    if (newOrder === currentOrder) {
      return ApiResponse.success(
        res,
        { featuredItem },
        "Order remains unchanged"
      );
    }

    if (newOrder > currentOrder) {
      // Moving down in the list
      await FeaturedOrder.updateMany(
        {
          type,
          order: { $gt: currentOrder, $lte: newOrder },
          media: { $ne: mediaId }
        },
        { $inc: { order: -1 } }
      );
    } else {
      // Moving up in the list
      await FeaturedOrder.updateMany(
        {
          type,
          order: { $gte: newOrder, $lt: currentOrder },
          media: { $ne: mediaId }
        },
        { $inc: { order: 1 } }
      );
    }

    featuredItem.order = newOrder;
    await featuredItem.save();

    return ApiResponse.success(
      res,
      { featuredItem },
      "Featured order updated successfully"
    );
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error updating featured order");
  }
});

// Get all featured media
exports.getFeaturedMedia = asyncHandler(async (req, res, next) => {
  try {
    const { type } = req.query; // "video" or 'article'

    let query = {};
    if (type && ["video", "article"].includes(type)) {
      query.type = type;
    }

    const featuredItems = await FeaturedOrder.find(query)
      .sort({ type: 1, order: 1 })
      .populate({
        path: "media",
        populate: [
          { path: "topic", select: "title" },
          { path: "author", select: "firstName lastName profilePicture" }
        ]
      });

    const result = featuredItems.map(item => ({
      ...item.media.toObject(),
      featuredOrder: item.order
    }));

    return ApiResponse.success(
      res,
      { featuredMedia: result },
      "Featured media fetched successfully"
    );
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error fetching featured media");
  }
});


exports.addMediaToFavorites = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;

    const mediaId = req.params.id;


    const media = await Media.findById(mediaId);
    if (!media) {
      return ApiResponse.error(res, "Media item not found", 404);
    }

    const user = await User.findById(userId);
    if (!user) {
      return ApiResponse.error(res, "User not found", 404);
    }
    if (!user.favorites.includes(mediaId)) {
      user.favorites.push(mediaId);
      await user.save();
    }
    return ApiResponse.success(res, { favoriteMedia: user.favorites }, "Media added to favorites successfully");
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error adding media to favorites");
  }
});


exports.reportMedia = asyncHandler(async (req, res, next) => {
  try {
    const reportedBy = req.user.id;
    const mediaId = req.params.id;

    const { reason } = req.body;

    const media = await Media.findById(mediaId).populate("authorRole");;
    if (!media) {
      return ApiResponse.error(res, "Media item not found", 404);
    }


    // const { reportedUser, reason, reportedUserRole } = req.body;
    const reportedUser = media.author;
    const reportedUserRole = media.authorRole.accountType;
    // Validate request data
    if (!reportedUser || !reason || reason.trim() === "" || !reportedUserRole) {
      return ApiResponse.error(res, "All fields (reportedUser, reason, reportedUserRole) are required", 400);
    }

    // Ensure reportedUserRole is valid
    // if (!["serviceuser", "counsellor"].includes(reportedUserRole)) {
    //   return ApiResponse.error(res, "Invalid reportedUserRole", 400);
    // }

    // Check if the reported user exists
    const userExists = await User.findById(reportedUser);
    if (!userExists) {
      return ApiResponse.error(res, "Reported user not found", 404);
    }

    // Create report
    const report = new ReportUser({
      reportedBy,
      reportedEntity: mediaId,
      entityType: "Media",
      reportedUser,
      reportedUserRole,
      description: reason,
    });

    await report.save();

    return ApiResponse.success(
      res,
      { report, issueType: reportedUserRole === "counsellor" ? "Counselor Issue" : "User Issue" },
      "User reported successfully"
    );

    // if (!reason || reason.trim() === "") {
    //   return ApiResponse.error(res, "Report reason is required", 400);
    // }

    // const media = await Media.findById(mediaId);
    // if (!media) {
    //   return ApiResponse.error(res, "Media item not found", 404);
    // }

    // media.reports.push({
    //   reason,
    //   reportedAt: new Date(),
    // });

    // await media.save();




    // return ApiResponse.success(res, { reports: media.reports }, "Media reported successfully");
  } catch (error) {
    AppLogger.error(error.message);
    return ApiResponse.error(res, "Error reporting media");
  }
});


exports.likeMedia = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const mediaId = req.params.id;

    const media = await Media.findById(mediaId);
    if (!media) {
      return ApiResponse.error(res, "Media item not found", 404);
    }

    if (media.likes.includes(userId)) {
      return ApiResponse.error(res, "You have already liked this media", 400);
    }

    media.likes.push(userId);
    media.likesCount += 1;

    await media.save();

    return ApiResponse.success(res, { likes: media.likesCount }, "Media liked successfully");
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error liking media");
  }
});
exports.addComment = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const mediaId = req.params.id;
    const { content } = req.body;

    if (!content) {
      return ApiResponse.error(res, "Comment content is required", 400);
    }

    // Find the media item
    const media = await Media.findById(mediaId);
    if (!media) {
      return ApiResponse.error(res, "Media item not found", 404);
    }

    // Create a new comment object
    const newComment = {
      content,
      likes: [],  // Initialize likes as an empty array for user IDs
      author: userId,
      createdAt: new Date()
    };

    // Add the new comment to media's comments array
    media.comments.push(newComment);

    // Save the media with the new comment
    await media.save();

    // Populate the author field for comments with their names
    await media.populate({
      path: "comments.author",
      select: "firstName lastName"
    }).execPopulate();

    return ApiResponse.success(res, { media }, "Comment added successfully");
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error adding comment");
  }
});


exports.likeComment = asyncHandler(async (req, res, next) => {
  try {
    const { mediaId, commentId } = req.params;
    const userId = req.user.id;

    const media = await Media.findById(mediaId);
    if (!media) {
      return ApiResponse.error(res, "Media item not found", 404);
    }

    const comment = media.comments.id(commentId);
    if (!comment) {
      return ApiResponse.error(res, "Comment not found", 404);
    }

    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
      comment.likesCount += 1;
    } else {
      return ApiResponse.error(res, "You have already liked this comment", 400);
    }

    await media.save();

    return ApiResponse.success(res, {
      likesCount: comment.likesCount
    }, "Comment liked successfully");
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error liking comment");
  }
});


exports.replyToComment = asyncHandler(async (req, res, next) => {
  try {
    const { mediaId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const media = await Media.findById(mediaId);
    if (!media) {
      return ApiResponse.error(res, "Media item not found", 404);
    }

    const comment = media.comments.id(commentId);
    if (!comment) {
      return ApiResponse.error(res, "Comment not found", 404);
    }

    if (content) {
      comment.replies.push({
        content: content,
        createdAt: Date.now(),
        author: userId,
      });
    } else {
      return ApiResponse.error(res, "Content for the reply is required", 400);
    }

    await media.save();

    return ApiResponse.success(res, {
      replies: comment.replies,
    }, "Reply added successfully");
  } catch (error) {
    AppLogger.error(error);
    return ApiResponse.error(res, "Error replying to comment");
  }
});


const asyncHandler = require("../../middlewares/asyncHandler");
const Thoughts= require("../../models/v2/ThoughtOfTheDay");
const ApiResponse = require("../../utils/ApiResponse");


exports.todaysThought = asyncHandler(async (req, res, next) => {
    try {
        // Calculate today's date range (beginning and end of the day)
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        // Query the database for thoughts scheduled for today
        const todaysThoughts = await Thoughts.find({
            scheduledDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        // Return the thoughts using the ApiResponse.success method
        return ApiResponse.success(res, todaysThoughts);
    } catch (error) {
        return ApiResponse.error(res,"Error fetching thoughts of the day",500);
    }
});


exports.trackView = asyncHandler(async (req, res, next) => {
    try {
        const thoughtId = req.params.id;  // Assuming thought ID is passed as a URL parameter
        
        if (!thoughtId) {
            return ApiResponse.error(res, "Thought ID is required", 400);
        }

        await Thoughts.findByIdAndUpdate(thoughtId, {
            $inc: { viewCount: 1 }
        });

        return ApiResponse.success(res, "View count updated successfully");
    } catch (error) {
        return ApiResponse.error(res, "Error tracking views for thoughts of the day", 500);
    }
});

exports.trackShare = asyncHandler(async (req, res, next) => {
    try {
        const thoughtId = req.params.id;
        const { platform } = req.body;

        if (!thoughtId) {
            return ApiResponse.error(res, "Thought ID is required", 400);
        }

        if (!platform) {
            return ApiResponse.error(res, "Platform is required", 400);
        }

        const thought = await Thoughts.findById(thoughtId);

        if (!thought) {
            return ApiResponse.error(res, "Thought not found", 404);
        }

        // Check if the platform already exists in the shares array
        const shareEntry = thought.shares.find(share => share.platform === platform);


        if (shareEntry) {
            // If the platform exists, increment the count
            shareEntry.count += 1;
        } else {
            // If the platform doesn't exist, add it with a count of 1
            thought.shares.push({ platform, count: 1 });
        }

        // Save the updated thought document
        await thought.save();

        return ApiResponse.success(res, "Share tracked successfully");
    } catch (error) {
        return ApiResponse.error(res, error.message, 500);
    }
});

exports.scheduleThoughts = asyncHandler(async (req, res, next) => {
    const { thoughts } = req.body;


    if (!Array.isArray(thoughts) || thoughts.length === 0) {
        return ApiResponse.failure(res,"Invalid input: Expected an array of thoughts.");
    }

    try {
        // Get the user from request object
        const userId = req.user._id;
        // Prepare the thoughts for bulk insert
        const thoughtsToInsert = thoughts.map(thought => {
            const { text, scheduledDate } = thought;
            if (!text || !scheduledDate) {
                return ApiResponse.failure(res,"Text and scheduledDate are required for each thought.")
            }
            return { text, scheduledDate, user: userId };
        });

        // Insert the thoughts in bulk
        const result = await Thoughts.insertMany(thoughtsToInsert);

        return ApiResponse.success(res,result,"Thoughts scheduled successfully.");

    } catch (error) {

        return ApiResponse.error(res,"Failure Scheduling Thoughts",);
        //return ApiResponse.error(res,error.message,);
    }
});
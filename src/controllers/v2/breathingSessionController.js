const asyncHandler = require("../../middlewares/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const BreathingSession = require("../../models/v2/BreathingSession")


exports.logBreathingSession = asyncHandler(async (req, res, next) => {
  
    try {
        const userId = req.user.id;
        const { startTime, duration } = req.body;
    
        const session = new BreathingSession({
          userId,
          startTime,
          duration
        });
    
        await session.save();
        return ApiResponse.success(res,session,"Breathing session created");

      } catch (error) {
        res.status(500).json({ message: "Error creating breathing session", error });
      }
    
});

exports.BreathingSessionSummary = asyncHandler(async (req, res, next) => {
  
    try {
        const userId = req.user.id;
        const statsAndDetails = await BreathingSession.getUserBreathingStatsAndDetails(userId);
        return ApiResponse.success(res,statsAndDetails,"Breathing session summary fetched");
      } catch (error) {
        res.status(500).json({ message: "Error getting breathing session summary for user", error });
      }
    
});

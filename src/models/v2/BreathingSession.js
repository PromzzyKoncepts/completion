const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const breathingSessionSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,  // Duration in minutes
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  breathingSessionSchema.statics.getUserBreathingStatsAndDetails = async function (userId) {
    try {
      // Aggregation for total sessions and total duration
      const stats = await this.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } }, 
        {
          $group: {
            _id: "$userId",
            totalSessions: { $sum: 1 },             // Count total sessions
            totalDuration: { $sum: "$duration" }    // Sum the total duration in seconds
          }
        }
      ]);
  
      // Fetch session details sorted by startTime (descending)
      const sessions = await this.find({ userId: mongoose.Types.ObjectId(userId) })
        .sort({ startTime: -1 })
        .select("startTime duration createdAt");
  
      // Helper function to format duration (MM:SS)
      const formatDuration = (duration) => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
      };
  
      // Map sessions to include formatted duration
      const sessionDetails = sessions.map(session => ({
        startTime: session.startTime,
        durationInSeconds: session.duration,   // Keep duration in seconds
        formattedDuration: formatDuration(session.duration), // Add formatted duration
        createdAt: session.createdAt
      }));
  
      // Return total stats and session details
      return {
        totalSessions: stats.length > 0 ? stats[0].totalSessions : 0, 
        totalDurationInSeconds: stats.length > 0 ? stats[0].totalDuration : 0,
        formattedTotalDuration: formatDuration(stats.length > 0 ? stats[0].totalDuration : 0),
        sessionDetails: sessionDetails
      };
    } catch (error) {
      AppLogger.error(error);
      throw error;
    }
  };
  

const BreathingSession = mongooseV2.model("BreathingSession", breathingSessionSchema);

module.exports = BreathingSession;

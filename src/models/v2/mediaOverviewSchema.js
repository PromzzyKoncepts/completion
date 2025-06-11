const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const mediaOverviewSchema = new mongoose.Schema(
    {
        articleClicks: { type: Number, default: 0 },
        videoPlays: { type: Number, default: 0 },

        mediaFavourited: { type: Number, default: 0 },
        mediaShared: { type: Number, default: 0 },

        recordDate: {
            type: Date,
            default: () => new Date().setHours(0, 0, 0, 0),
        }, // Midnight for the day
    },
    { timestamps: true }
);

module.exports = mongooseV2.model("MediaOverview", mediaOverviewSchema);

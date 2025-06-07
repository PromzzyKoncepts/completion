const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const sessionCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        description: {
            type: String,
        },
        code: {
            type: String,
        },
        colorCode: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongooseV2.model(
    "SessionCategory",
    sessionCategorySchema,
    "session-categories"
);

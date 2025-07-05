const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const intakeResponseSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        response: [
            {
                question: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "IntakeQuestionnaire",
                    required: true,
                },
                answers: [
                    {
                        type: String,
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongooseV2.model(
    "IntakeResponse",
    intakeResponseSchema,
    "intake-responses"
);

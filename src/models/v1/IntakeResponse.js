const mongoose = require("mongoose");

const intakeResponseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    response: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "IntakeQuestionnaire",
            },
            textFieldResponse: String,
            selectedOption: [String],
        },
    ],
});

module.exports = mongoose.model(
    "IntakeResponse",
    intakeResponseSchema,
    "intake-responses"
);

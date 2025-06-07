const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const intakeQuestionnaireSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        options: [
            {
                type: String,
            },
        ],
        multipleChoice: {
            type: Boolean,
        },
        showTextArea: {
            type: Boolean,
        },
        textAreaPlaceholder: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongooseV2.model(
    "IntakeQuestionnaire",
    intakeQuestionnaireSchema,
    "intake-questionnaire"
);

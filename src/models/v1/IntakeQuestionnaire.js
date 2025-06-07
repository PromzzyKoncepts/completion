const mongoose = require("mongoose");

const intakeQuestionnaireSchema = new mongoose.Schema({
    title: String,
    options: [String],
    multipleChoice: {
        type: Boolean,
    },
    showTextArea: {
        type: Boolean,
    },
    textAreaPlaceholder: {
        type: String,
    },
});

module.exports = mongoose.model(
    "IntakeQuestionnaire",
    intakeQuestionnaireSchema,
    "intake-questionnaire"
);

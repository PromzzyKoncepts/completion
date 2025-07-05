const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const AssessmentResponseSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    respondent:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      answerText: {
        type: String,
      },
      selectedOption: {
        type: String,
      },
      rating: {
        type: Number,
      },
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongooseV2.model(
  "AssessmentResponse",
  AssessmentResponseSchema,
);

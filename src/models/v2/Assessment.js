const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ["text", "multiple-choice", "rating"],
    required: true,
  },
  options: [{
    type: String,
  }], // Only required for multiple-choice questions
});

const AssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    questions: [QuestionSchema],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongooseV2.model(
  "Assessment",
  AssessmentSchema,
);

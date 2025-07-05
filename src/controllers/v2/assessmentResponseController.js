const ApiResponse = require("../../utils/ApiResponse");
const AssessmentResponse = require("../../models/v2/AssessmentResponse");
const Factory = require("../../utils/factory");

exports.submitResponse = async (req, res) => {
  try {
    const { _id } = req.user;
    const { assessmentId, ...rest } = req.body;

    const data = {
      assessment: assessmentId,
      respondent: _id,
      rest
    }

    const newResponse = AssessmentResponse.create(data);

    return ApiResponse.success(res, newResponse);
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
}

exports.getResponse = Factory.get(AssessmentResponse);

exports.getPatientResponsesForCounsellor = async (req, res) => {
  try {
    const { _id } = req.user;
    const { userId } = req.params;

    const responses = await AssessmentResponse.find({ respondent: userId })
      .populate({
        path: "assessment",
        match: { creator: _id },
      })
      .exec();

    return ApiResponse.success(res, responses);
  } catch (error) {
    return ApiResponse.error(res, error.message)
  }
}

exports.getUserResponseForAssessment = async (req, res) => {
  try {
    const { _id } = req.user;
    const { userId, assessmentId } = req.params;

    const responses = await AssessmentResponse.find({ respondent: userId })
      .populate({
        path: "assessment",
        match: { creator: _id, _id: assessmentId },
      })
      .exec();

    return ApiResponse.success(res, responses);
  } catch (error) {
    return ApiResponse.error(res, error.message)
  }
}

exports.deleteResponse = Factory.delete(AssessmentResponse);

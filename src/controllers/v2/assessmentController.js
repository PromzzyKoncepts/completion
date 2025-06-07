const ApiResponse = require("../../utils/ApiResponse");
const Assessment = require("../../models/v2/Assessment");
const Factory = require("../../utils/factory");

exports.createAssessment = async (req, res) => {
  try {
    const { _id } = req.user;

    const data = {
      ...req.body,
      creator: _id,
    }

    const newAssessment = await Assessment.create(data);

    return ApiResponse.success(res, newAssessment, "success", 201);
  } catch (error) {
    return ApiResponse.error(res, error.message);
  }
}

exports.getAssessment = Factory.get(Assessment);

exports.deleteAssessment = Factory.delete(Assessment);


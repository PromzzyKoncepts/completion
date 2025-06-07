const IntakeResponse = require("../../models/v2/IntakeResponse");
const Factory = require("../../utils/factory");

exports.get = Factory.get(IntakeResponse);

exports.getAll = Factory.getAll(IntakeResponse);

exports.create = Factory.create(IntakeResponse);

exports.update = Factory.update(IntakeResponse);

exports.delete = Factory.delete(IntakeResponse);

exports.getMyResponses = async (req, res, next) => {
    const intakeResponses = await IntakeResponse.find({
        user: req.user.id,
    }).populate("intakeQuestionnaire");

    res.status(200).json({
        status: "success",
        message: "Intake Responses fetched successfully",
        data: {
            intakeResponses,
        },
    });
};

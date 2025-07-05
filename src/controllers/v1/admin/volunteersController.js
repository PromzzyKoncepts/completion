const asyncHandler = require("../../../middlewares/asyncHandler");
const User = require("../../../models/v1/User");
const VideoSDKService = require("../../../services/videoSDKService");

class VoulunteersController {
    static fetchVolunteers = asyncHandler(async (req, res, next) => {
        const { status } = req.params;

        const volunteerQuery = () => {
            switch (status) {
                case "approved":
                    return { volunteer: { isVolunteer: true } };
                case "unapproved":
                    return { volunteer: { status: "pending" } };
                case "rejected":
                    return { volunteer: { status: "rejected" } };
                default:
                    return {};
            }
        };

        const data = await User.find(volunteerQuery())
            .select("name volunteer")
            .lean()
            .exec();

        return res.status(200).json({
            status: "success",
            data,
        });
    });

    static approveVolunteer = asyncHandler(async (req, res, next) => {
        const videoSDKResponse = await VideoSDKService.createRoom(
            req,
            res,
            next
        );

        const newRoomInfo = videoSDKResponse.data;

        const data = await User.findOneAndUpdate(
            { _id: req.params.id },
            {
                volunteer: {
                    isVolunteer: true,
                    status: "approved",
                    roomInfo: newRoomInfo,
                },
                accountType: "counsellor",
            },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: "User approved successfullly",
            data,
        });
    });

    static rejectVolunteer = asyncHandler(async (req, res) => {
        const data = await User.findOneAndUpdate(
            { _id: req.params.id },
            {
                volunteer: {
                    isVolunteer: false,
                    status: "rejected",
                },
                ...req.body,
            },
            { new: true }
        );

        return res.status(200).json({
            status: "success",
            message: "You have rejected this user",
            data,
        });
    });
}

module.exports = { VoulunteersController };

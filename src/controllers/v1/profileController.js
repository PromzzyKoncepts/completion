const lodash = require("lodash");
const asyncHandler = require("../../middlewares/asyncHandler");
const User = require("../../models/v1/User");
const MailNotificationService = require("../../services/mailNotificationService");
const AppError = require("../../utils/appError");

class profileController {
    static getProfile = asyncHandler(async (req, res) => {
        const data = await User.findOne({ _id: req.user.id })
            .select("-sessionPreferences")
            .populate({
                path: "pinnedTopics",
                select: "-likes",
                populate: {
                    path: "author category",
                },
            })
            .exec();

        return res.status(200).json({
            status: "success",
            data,
        });
    });

    static updateProfile = asyncHandler(async (req, res, next) => {
        if (lodash.isEmpty(req.body)) {
            return next(
                new AppError("Please fill in sections to be updated", 400)
            );
        }

        await User.findOneAndUpdate({ _id: req.user.id }, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: "success",
            message: "Profile Updated successfully",
        });
    });

    static volunteerRequest = asyncHandler(async (req, res) => {
        const user = await User.findOne({ _id: req.user.id });
        user.volunteer.status = "pending";
        user.volunteer.isVolunteer = true;
        await user.save();

        await MailNotificationService.sendMail({
            recipient: "support@positiveo.io",
            subject: "New volunteer request",
            html: `<p>Dear Admin,
                    <br /><br />
                    A request to volunteer for Postiveo is awaiting your approval.
                    <br />
                    Details of the volunteer are as follows:
                    <br />
                    Name: ${user.name}
                    <br />
                    Email: ${user.email}
                    <br /><br />
                    Thank you</p>`,
        });

        return res.status(200).json({
            status: "success",
            message:
                "Your volunteer request has been submitted and is currently awaiting approval",
        });
    });

    static cancelVolunteerRequest = asyncHandler(async (req, res) => {
        await User.findOneAndUpdate(
            { _id: req.user.id },
            { volunteer: { status: "none", isVolunteer: false } }
        );

        return res.status(200).json({
            status: "success",
            message:
                "Your volunteer request has been cancelled and your volunteer access revoked. You will no longer receive peer support sessions",
        });
    });
}

module.exports = { profileController };

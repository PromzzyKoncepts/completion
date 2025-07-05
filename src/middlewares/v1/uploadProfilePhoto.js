const User = require("../../models/v1/User");
const cloudinary = require("cloudinary").v2;
const { dataUri } = require("./multerUploads");

const uploadImage = (req, res, next) => {
    const file = dataUri(req).content;
    return cloudinary.uploader
        .upload(file)
        .then((result) => {
            const data = {
                url: result.url,
                reference: result.public_id,
            };
            req.body.profilePicture = data;
            next();
        })
        .catch((err) =>
            res.status(400).json({
                message:
                    "Unable to process request. please check your connection and try again",
                err: err.error,
            })
        );
};

const uploadProfilePicture = async (req, res, next) => {
    if (req.file) {

        const findUser = await User.findOne({ _id: req.user.id });
        if (findUser.profilePicture?.reference) {
            await cloudinary.uploader.destroy(
                findUser.profilePicture.reference,
                function (result) {
                }
            );
        }
        uploadImage(req, res, next);
    } else {

        next();
    }
};

module.exports = { uploadImage, uploadProfilePicture };

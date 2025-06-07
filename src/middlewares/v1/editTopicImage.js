const Topic = require("../../models/v1/Topic");
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

const uploadTopicImage = async (req, res, next) => {
    if (req.file) {
        const findTopic = await Topic.findOne({ _id: req.params.id });
        if (findTopic.image?.reference) {
            await cloudinary.uploader.destroy(
                findTopic.image.reference,
                function (result) {

                }
            );
        }
        uploadImage(req, res, next);
    } else {
        next();
    }
};

module.exports = { uploadImage, uploadTopicImage };

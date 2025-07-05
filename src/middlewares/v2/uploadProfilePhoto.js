const User = require("../../models/v2/Base");
const cloudinary = require("cloudinary").v2;

// const uploadImage = (req, res, next) => {
//     const file = dataUri(req).content;
//     return cloudinary.uploader
//         .upload(file)
//         .then((result) => {
//             const data = {
//                 url: result.url,
//                 reference: result.public_id,
//             };
//             req.body.profilePicture = data;
//             next();
//         })
//         .catch((err) =>
//             res.status(400).json({
//                 message:
//                     "Unable to process request. please check your connection and try again",
//                 err: err.error,
//             })
//         );
// };
const uploadImage = (req, res, next) => {
    // Check if the picture data is provided in the request body
    if (req.body.picture) {
        // Extract the Base64 data from the request body
        const base64Data = req.body.picture.replace(/^data:image\/(png|jpeg);base64,/, "");

        // Convert Base64 string to Buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Upload the image to Cloudinary
        cloudinary.uploader.upload_stream(
            {
                folder: "ProfilePicture", // Specify the directory in Cloudinary if needed
                resource_type: "image",
                format: "png", // Adjust based on your image format
            },
            (error, result) => {
                if (error) {
                    return res.status(400).json({
                        message: "Unable to process request. Please check your connection and try again",
                        err: error.message,
                    });
                }

                // Update the request body with the Cloudinary response data
                req.body.profilePicture = {
                    url: result.url,
                    reference: result.public_id,
                };

                // Proceed to the next middleware
                next();
            }
        ).end(buffer); // End the stream with the image buffer
    } else {
        next();
    }
};

const uploadProfilePicture = async (req, res, next) => {
    if (req.body.picture) {
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

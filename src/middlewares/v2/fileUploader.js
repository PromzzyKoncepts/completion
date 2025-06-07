const { uploadFile } = require("../../configs/cloudinary/uploader");
const AppError = require("../../utils/appError");

const fileUploader = async (req, res, next) => {
    try {
        const certificates = req.body.mentalHealthCertificates || [];

        // Ensure that we have both the files and the names
        if (req.files.length !== certificates.length) {
            return next(
                new AppError(
                    "The number of files and certificate names must match.",
                    400
                )
            );
        }

        // Map the uploaded files to the certificate objects
        certificates.forEach((cert, index) => {
            cert.file = req.files[index];
        });

        // Upload files to Cloudinary
        const uploadPromises = certificates.map((cert) => {
            return uploadFile(cert.file.buffer).then((result) => ({
                name: cert.name,
                file: result.secure_url,
            }));
        });

        const uploadedCertificates = await Promise.all(uploadPromises);

        req.body.mentalHealthCertificates = uploadedCertificates;
        next();
    } catch (error) {
        new AppError(error.message, 500);
    }
};

module.exports = fileUploader;

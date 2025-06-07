const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Create a Cloudinary storage instance for a specific folder.
 * @param {string} folder - The folder where uploaded files will be stored in Cloudinary.
 * @returns {CloudinaryStorage} Cloudinary storage instance.
 */
const createCloudinaryStorage = (folder) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: folder,
            // support only images and pdfs
            resource_type: "auto",
            allowedFormats: ["jpg", "jpeg", "png", "pdf"], // Specify the allowed file formats
            // max file size 5mb
            maxFileSize: 5 * 1024 * 1024,
        },
    });
};

/**
 * Create a Multer upload instance with a specific storage configuration.
 * @param {string} folder - The folder where uploaded files will be stored in Cloudinary.
 * @returns {multer} Multer upload instance.
 */
const createMulterUpload = (folder) => {
    const storage = createCloudinaryStorage(folder);
    return multer({ storage: storage });
};

/**
 * Default multer upload instance.
 */
const upload = createMulterUpload("positiveo-v2");

module.exports = {
    upload,
};

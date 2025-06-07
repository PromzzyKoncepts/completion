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
            resource_type: "auto",
            allowedFormats: ["jpg", "jpeg", "png", "pdf"], 
            
            maxFileSize: 5 * 1024 * 1024,
        },
    });
};

/**
 * Create a Multer upload instance with a specific storage configuration.
 * @param {string} folder - The folder where uploaded files will be stored in Cloudinary.
 * @returns {multer} Multer upload instance.
 */
// const createMulterUpload = (folder) => {
//     console.log("Multer initialized for folder:", folder);
//     const storage = createCloudinaryStorage(folder);
//     return multer({ storage: storage });
// };


const createMulterUpload = (folder) => {
    const storage = createCloudinaryStorage(folder);
    return multer({ 
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Invalid file type. Only images (JPEG, PNG, GIF) and PDFs are allowed."));
            }
        }
    });
};


/**
 * Default multer upload instance.
 */
// const upload = createMulterUpload("positiveo-v2");

const upload = createMulterUpload("positiveo-v2");
// console.log("Upload middleware configured:", upload);

module.exports = {
    upload,
};

// const multer = require("multer");
// const storage = multer.memoryStorage(); // Store files in memory as Buffer
// const upload = multer({ storage });
//
// module.exports = upload;
const multer = require("multer");
const Datauri = require("datauri/parser");
const path = require("path");
const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single("image");

/**
 * @description This function converts the buffer to data url
 * @param {Object} req containing the field object
 * @returns {String} The data url from the string buffer
 * @author Andrew Bamidele
 */

const dataUri = (req) => {
    const dUri = new Datauri();
    return dUri.format(
        path.extname(req.file.originalname).toString(),
        req.file.buffer
    );
};

module.exports = { multerUploads, dataUri };

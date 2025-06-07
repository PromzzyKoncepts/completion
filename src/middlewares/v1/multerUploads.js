const multer = require("multer");
const Datauri = require("datauri/parser");
const path = require("path");
// const storage = multer.memoryStorage();
// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "ProfileUploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});
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

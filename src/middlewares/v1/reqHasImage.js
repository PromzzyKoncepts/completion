const { uploadImage } = require("./uploadProfilePhoto");

const reqHasImage = (req, res, next) => {
    if (req.file) {
        uploadImage(req, res, next);
    } else {
        next();
    }
};

module.exports = { reqHasImage };

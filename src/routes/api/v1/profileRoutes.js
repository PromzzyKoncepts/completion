const express = require("express");

const {
    profileController,
} = require("../../../controllers/v1/profileController");
const { multerUploads } = require("../../../middlewares/v1/multerUploads");
const {
    uploadProfilePicture,
} = require("../../../middlewares/v1/uploadProfilePhoto");
const {
    changeUserPassword,
} = require("../../../middlewares/v1/changePassword");
const Auth0Middleware = require("../../../middlewares/v1/auth0");
const router = express.Router();

router.use(Auth0Middleware.checkJwt);
router.use(Auth0Middleware.appendUserId);

router.get("/", profileController.getProfile);

router.patch(
    "/",
    multerUploads,
    changeUserPassword,
    uploadProfilePicture,
    profileController.updateProfile
);

router.patch("/volunteer-request", profileController.volunteerRequest);

router.patch(
    "/cancel-volunteer-request",
    profileController.cancelVolunteerRequest
);

module.exports = router;

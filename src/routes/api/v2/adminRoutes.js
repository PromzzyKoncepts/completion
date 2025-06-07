const express = require("express");
const adminontroller = require("../../../controllers/v2/adminController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const reportController = require("../../../controllers/v2/reportUserController");
const { upload } = require("../../../middlewares/media");
const asyncHandler = require("../../../middlewares/asyncHandler");
const articleController = require("../../../controllers/v2/adminArticleController");

const router = express.Router();

router.get(
    "/user-overview",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getUserOverview
);

router.get(
    "/town-square-overview",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getTownSquareOverview
);

router.get(
    "/user-management",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    adminontroller.getUserManagement
);

router.get(
    "/incidents",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    reportController.getUserReports
);

// ARTICLE ROUTES FOR ADMIN
// Create article
router.post(
    "/articles",
    AuthMiddleware.protect,
    // upload.single("featuredImage"),
    
    upload.fields([
        { name: "featuredImage", maxCount: 1 }, // Single file
        { name: "additionalImages", maxCount: 10 }, // Multiple files (up to 10)
    ]),
    async (req, res, next) => {
        // Process uploaded files
        if (req.files) {
            if (req.files.featuredImage) {
                req.body.featuredImage = req.files.featuredImage[0].path; // Cloudinary URL
            }
            if (req.files.additionalImages) {
                req.body.additionalImages = req.files.additionalImages.map(file => file.path);
            }
        }
        next();
    },

    articleController.createArticle
);

// Get article by ID
router.get("/articles/:id", articleController.getArticleById);

// Update article
router.put(
    "/articles/:id",
    AuthMiddleware.protect,
    upload.single("featuredImage"),
    asyncHandler(async (req, res, next) => {
        // Process the uploaded featured image if it exists
        if (req.file) {
            req.body.featuredImage = req.file.path;
        }
        next();
    }),
    articleController.updateArticle
);

// Delete article
router.delete("/articles/:id", AuthMiddleware.protect, articleController.deleteArticle);
module.exports = router;

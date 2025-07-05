const express = require("express");

const router = express.Router();

const AuthMiddleware = require("../../../middlewares/v2/auth");
const IntakeResponseController = require("../../../controllers/v2/intakeResponseController");

router.use(AuthMiddleware.protect);

router
    .route("/")
    .get(IntakeResponseController.getAll)
    .post(IntakeResponseController.create);

router
    .route("/:id")
    .get(IntakeResponseController.get)
    .patch(IntakeResponseController.update)
    .delete(IntakeResponseController.delete);

router.get("/me", IntakeResponseController.getMyResponses);

module.exports = router;

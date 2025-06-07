const express = require("express");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const IntakeQuestionnaireController = require("../../../controllers/v2/intakeQuestionnaireController");

const router = express.Router();

router.use(AuthMiddleware.protect);

router
    .route("/")
    .get(IntakeQuestionnaireController.getAll)
    .post(
        AuthMiddleware.hasPrivilege("admin"),
        IntakeQuestionnaireController.create
    );

router
    .route("/:id")
    .get(IntakeQuestionnaireController.get)
    .patch(
        AuthMiddleware.hasPrivilege("admin"),
        IntakeQuestionnaireController.update
    )
    .delete(
        AuthMiddleware.hasPrivilege("admin"),
        IntakeQuestionnaireController.delete
    );

module.exports = router;

const express = require("express");
const {
    SessionController,
} = require("../../../controllers/v1/sessionController");
const Auth0Middleware = require("../../../middlewares/v1/auth0");
const { ValidateSession } = require("../../../middlewares/v1/validateSession");

const router = express();

router.use(Auth0Middleware.checkJwt);
// routes below are protected by CheckJwt

router.post("/rooms", SessionController.createRoom);

router.get("/rooms/:roomId", SessionController.fetchRoom);

router.get("/rooms/:roomId/validate", SessionController.validateRoom);

router.post("/rooms/:roomId/deactivate", SessionController.deactivateRoom);

router.use(Auth0Middleware.appendUserId);
// routes below are protected by CheckJwt and appendUserId

router.post(
    "/",
    ValidateSession.createSession,
    SessionController.createSession
);

// TODO: implement this route
// router.get("/", SessionController.fetchAllSessions);

// add query params to filter sessions
router.get("/user", SessionController.fetchUserSessions);

// add query params to filter sessions
router.get("/counsellor", SessionController.fetchCounsellorSessions);

router.get("/peer-support", SessionController.fetchPeerSupportSessions);

router.get(
    "/counsellor-preferences",
    SessionController.fetchCounsellorSettings
);

router.patch(
    "/counsellor-preferences",
    SessionController.updateCounsellorSettings
);

router.get("/intake-questionnaire", SessionController.fetchIntakeQuestionnaire);

router.post("/intake-questionnaire", SessionController.addIntakeResponse);

router.get("/:id", SessionController.fetchSession);

router.patch("/:id", SessionController.updateSession);

router.delete("/:id", SessionController.deleteSession);

router.put("/:id/reschedule", SessionController.rescheduleSession);

router.post("/:id/note", SessionController.addSessionNote);

router.get("/:id/note", SessionController.fetchSessionNote);

router.post("/:id/review", SessionController.addReview);

router.get("/:id/joined", SessionController.sessionJoinedNotification);

module.exports = router;

const express = require("express");
const SessionController = require("../../../controllers/v2/sessionController");
const reviewRouter = require("./sessionReviewRoutes");
const sessionCategoriesRouter = require("./sessionCategoriesRoutes");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const SessionMiddleware = require("../../../middlewares/v2/session");
const SlotMiddleware = require("../../../middlewares/v2/slot");

const router = express.Router();

router.use("/:sessionId/reviews", reviewRouter);
router.use("/:sessionId/categories", sessionCategoriesRouter);

router.post("/:sessionId/rooms", AuthMiddleware.protect, SessionController.createRoom);

router.get("/rooms/:roomId", AuthMiddleware.protect, SessionController.getRoom);

router.get(
    "/rooms/:roomId/validate",
    AuthMiddleware.protect,
    SessionController.validateRoom
);

router.post(
    "/rooms/:roomId/deactivate",
    AuthMiddleware.protect,
    SessionController.deactivateRoom
);

router
    .route("/")
    .all(AuthMiddleware.protect)
    .get(SessionController.getAllSessions)
    .post(
        SessionMiddleware.validateCreateSession,
        SessionController.createSession
    );

router.get(
    "/user",
    AuthMiddleware.protect,
    SessionController.getMySessions,
    SessionController.getAllSessions
);

router.get(
    "/leader",
    AuthMiddleware.protect,
    SessionController.getLeaderSessions,
    SessionController.getAllSessions
);

router.post(
    "/:id/user/joined",
    AuthMiddleware.protect,
    SessionController.updateUserJoined
);

router.post(
    "/:id/leader/joined",
    AuthMiddleware.protect,
    SessionController.updateLeaderJoined
);

router.post(
    "/:id/respond",
    AuthMiddleware.protect,
    SessionMiddleware.validateRespondToSession,
    SessionController.respondToSession
);

router.post(
    "/:id/selfassign",
    AuthMiddleware.protect,
    AuthMiddleware.hasPrivilege("volunteer"),
    SessionController.selfAssignBookedSession
);

router.post(
  "/search",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser"),
  SessionMiddleware.validateCounsellorSearch,
  SessionController.searchForCounsellor
);

router.get(
  "/history",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  SessionController.getSessionHistory
)

router.get(
  "/:id/history",
  AuthMiddleware.protect,
  SessionController.getSessionHistoryById
)

router.get(
  "/upcoming",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  SessionController.getUpcomingSessions
);

router.post(
  "/rate/:sessionId",
  AuthMiddleware.protect,
  SessionMiddleware.validateRateSession,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  SessionController.rateSession
);

router.get(
  "/today",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  SessionController.todaysSchedule
);

router.get(
  "/user/all",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  SessionController.getUserSessions
);

router.get(
  "/month",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser", "counsellor"),
  SessionController.monthlySessions
);

router.patch(
  "/cancel/:sessionId",
  AuthMiddleware.protect,
  SessionController.cancelSession
);

router.patch(
  "/reschedule/:sessionId/:slotId",
  SlotMiddleware.validateBookSlot,
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser"),
  SessionController.rescheduleSession
);

router.post(
  "/growth-check-in",
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("counsellor"),
  SessionController.sendGrowthCheckIn
);

router
    .route("/:id")
    .all(AuthMiddleware.protect)
    .get(SessionController.getSession)
    .patch(
        SessionMiddleware.validateUpdateSession,
        SessionController.updateSession
    )
    .delete(
        AuthMiddleware.hasPrivilege("admin"),
        SessionController.deleteSession
    );

module.exports = router;

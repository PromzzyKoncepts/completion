const express = require("express");
const {
    DashboardController,
} = require("../../../controllers/v1/admin/dashboardController");
const {
    SessionsController,
} = require("../../../controllers/v1/admin/sessionsController");
const {
    TopicsController,
} = require("../../../controllers/v1/admin/topicsController");
const {
    UsersController,
} = require("../../../controllers/v1/admin/usersController");
const {
    VoulunteersController,
} = require("../../../controllers/v1/admin/volunteersController");
const { uploadTopicImage } = require("../../../middlewares/v1/editTopicImage");
const { multerUploads } = require("../../../middlewares/v1/multerUploads");
const { reqHasImage } = require("../../../middlewares/v1/reqHasImage");
const { uploadImage } = require("../../../middlewares/v1/uploadProfilePhoto");

const router = express.Router();

router.get("/dashboard/:period", DashboardController.fetchDashboard);

router.get("/users", UsersController.fetchUsers);

router.patch("/users/disable/:id", UsersController.disableUser);

router.patch("/users/enable/:id", UsersController.enableUser);

router.delete("/users/delete/:id", UsersController.deleteUser);

router.get("/counsellors", UsersController.fetchCounsellors);

router.get("/sessions", SessionsController.fetchSessions);

router.get(
    "/intake-questionnaire",
    SessionsController.fetchSessionIntakeQuestionnaire
);

router.get("/listening-ear", SessionsController.fetchListeningEar);

router.patch("/sessions/:id", SessionsController.updateSession);

router.delete("/sessions/:id", SessionsController.deleteSession);

router.get("/sessions/note/:id", SessionsController.fetchSessionNote);

router.get("/users/:id", UsersController.fetchUser);

router.get("/volunteers/:status", VoulunteersController.fetchVolunteers);

router.get("/topics", TopicsController.fetchTopics);

router.delete("/topics/:id", TopicsController.deleteTopic);

router.patch("/approve-volunteer/:id", VoulunteersController.approveVolunteer);

router.patch("/reject-volunteer/:id", VoulunteersController.rejectVolunteer);

router.post(
    "/topics",
    multerUploads,
    reqHasImage,
    TopicsController.createTopic
);

router.patch(
    "/topics/:id",
    multerUploads,
    uploadTopicImage,
    TopicsController.editTopic
);

module.exports = router;

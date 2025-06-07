
const express = require("express");
const ThoughtController = require("../../../controllers/v2/thoughtOfTheDayController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const thoughtController = require("../../../controllers/v2/thoughtOfTheDayController");
const router = express.Router();




router.get(
    "/today",
     AuthMiddleware.protect,
    ThoughtController.todaysThought
    );

/**
* @route POST /schedule-thoughts
* @description This endpoint handles the scheduling of multiple thoughts of the day.
* @param {Object[]} req.body.thoughts - Array of thought objects
* @param {string} req.body.thoughts[].text - The text of the thought
* @param {Date} req.body.thoughts[].scheduledDate - The scheduled date for the thought
* @returns {Object} - Confirmation of created thoughts
*/
router.post(
    "/schedule-thoughts",
    AuthMiddleware.protect,
    AuthMiddleware.restrictTo("admin"),
    thoughtController.scheduleThoughts
);


router.post(
    "/track-view/:id",
    AuthMiddleware.protect,
    thoughtController.trackView
);

router.post(
    "/track-share/:id",
    AuthMiddleware.protect,
    thoughtController.trackShare
);

module.exports = router;

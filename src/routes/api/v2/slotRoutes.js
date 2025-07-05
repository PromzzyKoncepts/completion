const express = require("express");
const slotController = require("../../../controllers/v2/slotController");
const router = express.Router();
const AuthMiddleware = require("../../../middlewares/v2/auth");
const SlotMiddleware = require("../../../middlewares/v2/slot");

router
    .route("/")
    .all(AuthMiddleware.protect)
    .get(slotController.getAllSlots)
    .post(
        AuthMiddleware.hasPrivilege("counsellor"),
        SlotMiddleware.validateCreateOrManySlots,
        slotController.createOneOrManySlots
    );

router.get(
    "/availability",
    AuthMiddleware.protect,
    slotController.getNextFreeSlots
);

router.get(
  "/counsellor/:id",
  AuthMiddleware.protect,
  slotController.getCounsellorFreeSlots
);

router
    .route("/:id")
    .all(AuthMiddleware.protect)
    .get(slotController.getSlot)
    .patch(
        AuthMiddleware.hasPrivilege("counsellor"),
        SlotMiddleware.validateUpdateSlot,
        slotController.updateSlot
    )
    .delete(
        AuthMiddleware.hasPrivilege("counsellor"),
        slotController.deleteSlot
    );

router.post(
  "/:slotId/book",
  SlotMiddleware.validateBookSlot,
  AuthMiddleware.protect,
  AuthMiddleware.restrictTo("serviceuser"),
  slotController.bookSlot
);

// router.put(
//     "/:id/cancel",
//     AuthMiddleware.protect,
//     slotController.cancelSlotBookingAndSession
// );

// router.put(
//     "/:id/reschedule",
//     AuthMiddleware.protect,
//     AuthMiddleware.hasPrivilege("counsellor"),
//     slotController.rescheduleSlotBooking
// );

// router.patch(
//     "/:id/assign",
//     AuthMiddleware.protect,
//     AuthMiddleware.hasPrivilege("counsellor"),
//     slotController.assignSlot
// );

module.exports = router;

const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

// date time format is dd-mm-yyyyThh:mm (24 hour format)
// example: 01-01-2021T00:00 (1st Jan 2021 12:00 AM)
// example: 01-01-2021T23:59 (1st Jan 2021 11:59 PM)
// example: 01-01-2021T23:59 (1st Jan 2021 11:59 PM)
const slotSchema = new mongoose.Schema(
  {
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: {
      type: Date
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    // slotId: {
    //     type: String,
    //     required: true,
    //     unique: true,
    // },
    jobIds: {
      type: String,
    },
    reminderJobIds: [
      {
        type: String,
      },
    ],
    // parentSlot: {
    //     type: String,
    // },
    // repeats: {
    //     type: String,
    //     enum: ["none", "daily", "workingDays", "weekly", "biweekly", "monthly"],
    //     default: "none",
    // },
    // expiresAt: {
    //     type: Date, // 2023-01-01T00:T00:00
    // },
    // expired: {
    //     type: Boolean,
    //     default: false,
    // },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
    // bookedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },
    bookedAt: {
      type: Date,
    },
    // use in case admin created slot
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  });

// slotSchema.pre("save", function (next) {
//     this.slotId = `${this.counsellor}-${this.startDateTime}-${this.endDateTime}`;
//     next();
// });

// filter expired slots
// slotSchema.pre(/^find/, function (next) {
//     this.find({ expired: { $ne: true } });
//     next();
// });

// check if slot is expired and set expired to true
// slotSchema.pre("save", function (next) {
//     if (this.expiresAt < Date.now()) {
//         this.expired = true;
//     }
//     next();
// });

module.exports = mongooseV2.model("Slot", slotSchema);

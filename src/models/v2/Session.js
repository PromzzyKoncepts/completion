const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");

const sessionSchema = new mongoose.Schema(
  {
    /**
     * The part that asks to add a title for the therapy session
     * could be replaced with a code with the service user's initials
     * or nickname. e.g EE’s 09.7 session. This is also relevant
     * for confidentiality or when the counsellor would like to go back
     * for notes.
     */
    title: {
      type: String,
      required: [true, "Please add a title for the session"],
    },
    description: {
      type: String,
    },
    /**
     * The type of session the user is requesting
     * This can be either counselling or listening
     * Listening is for non-therapeutic sessions
     * Counselling is for therapeutic sessions
     */
    // assistanceType: {
    //   type: String,
    //   enum: ["counselling", "listening"],
    //   required: [true, "Please select an assistance type"],
    // },
    interactionType: {
      type: String,
      enum: ["video", "audio", "chat"],
      required: [true, "Please select an interaction type"],
      // validate: {
      //   validator: function (val) {
      //     if (this.assistanceType === "listening") {
      //       return val === "audio" || val === "chat";
      //     }
      //     return true;
      //   },
      // },
    },
    status: {
      type: String,
      enum: [
        "declined",
        "cancelled",
        "completed",
        "requested",
        "booked",
        "assigned",
        "confirmed",
        "inProgress",
      ],
      default: "requested",
    },
    slots: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Slot"
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    cancellationReason: {
      type: String
    },
    // approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // approvedAt: {
    //     type: Date,
    // },
    /**
     * Notes added by the counsellor or listener
     * TODO: Should be encrypted
     */
    counsellorNotes: {
      title: "",
      content: "",
      date: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /**
     * User can request a specific counsellor/listener for sessions
     */
    // requestedCounsellor: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },
    requestedCounsellorNotified: {
      type: Boolean,
      default: false,
    },
    /**
     * The counsellor is the one conducting the session.
     * This can be a counsellor or listener.
     */
    counsellor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    counsellorHasAccepted: {
      type: Boolean,
      default: true,
    },
    userHasAccepted: {
      type: Boolean,
      default: false,
    },
    /**
     * The reason why the user has declined the session.
     */
    userResponseReason: {
      type: String,
    },
    /**
     * Information about the room where the session will be held.
     * It is a JSON object that contains the video call id and access tokens.
     */
    roomInfo: {
      type: Object,
    },
    sessionCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SessionCategory",
      },
    ],
    // sessionSlot: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Slot",
    // },
    intakeResponse: {
      type: Array,
    },
    userJoined: {
      type: Boolean,
      default: false,
    },
    userJoinedAt: {
      type: Date,
    },
    leaderJoined: {
      type: Boolean,
      default: false,
    },
    leaderJoinedAt: {
      type: Date,
    },
    sessionHeld: {
      type: Boolean,
      default: false,
      set: function (val) {
        if (!this.userJoined || !this.leaderJoined) {
          return false;
        }
        if (this.userJoined && this.leaderJoined) {
          this.status = "inProgress";
        }
        return val;
      },
    },
    missedSessionEmailSent: {
      type: Boolean,
    },
    followUpEmailSent: {
      type: Boolean,
    },
    sessionStartedAt: {
      type: Date,
    },
    sessionEndedAt: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    frequency: {
      type: String,
      enum: ["once", "weekly", "monthly"],
    },
    userRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
      isAnonymous: Boolean
    },
    counsellorRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      feedback: String,
      isAnonymous: Boolean
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongooseV2.model("Session", sessionSchema);

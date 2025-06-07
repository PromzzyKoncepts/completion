const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    uuid: {
        type: String,
        unique: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    email: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
    },
    username: {
        type: String,
        // unique: true, NOT SURE IF THIS IS BEING USED AT THE MOMENT
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    volunteer: {
        status: {
            type: String,
            enum: ["none", "pending", "approved", "rejected"],
            default: "none",
        },
        isVolunteer: {
            type: Boolean,
            default: false,
        },
        rejectionReason: {
            type: String,
        },
        roomInfo: {
            type: Object, // all the room info from VideoSDK
            get: function () {
                if (this.volunteer.status !== "approved" || this.blocked) {
                    return undefined; // return undefined if volunteer is not approved
                }
            },
        },
    },
    phone: {
        countryCode: { type: String },
        callingCode: { String },
        phone: { type: String },
    },
    gender: {
        type: String,
        enum: ["male", "female"],
    },
    country: {
        type: String,
    },
    pushToken: {
        type: String,
    },
    profilePicture: {
        url: {
            type: String,
            default:
                "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
        },
        reference: { type: String },
    },
    intakeQuestionnaireCompleted: {
        type: Boolean,
        default: false,
    },
    accountType: {
        type: String,
        enum: ["user", "counsellor", "listening_ear"],
        default: "user",
    },
    socialType: {
        type: String,
        enum: ["google-oauth2", "twitter", "facebook", "apple"],
    },
    notificationSettings: {
        sessionReschedule: { type: Boolean, default: true },
        commentReplies: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        mobilePushNotifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
    },
    pinnedTopics: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
        },
    ],
    sessionPreferences: {
        gender: { type: String },
        preferredFields: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SessionCategory",
            },
        ],
        workDays: {
            monday: {
                startTime: { type: String },
                endTime: { type: String },
            },
            tuesday: {
                startTime: { type: String },
                endTime: { type: String },
            },
            wednesday: {
                startTime: { type: String },
                endTime: { type: String },
            },
            thursday: {
                startTime: { type: String },
                endTime: { type: String },
            },
            friday: {
                startTime: { type: String },
                endTime: { type: String },
            },
            saturday: {
                startTime: { type: String },
                endTime: { type: String },
            },
            sunday: {
                startTime: { type: String },
                endTime: { type: String },
            },
        },
    },
});

/** Assign _id value to uuid before create */
userSchema.pre("save", function (next) {
    if (this.isNew) {
        this.uuid = this._id;
    }
    next();
});

module.exports = mongoose.model("User", userSchema);

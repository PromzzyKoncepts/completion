const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");
const argon = require("argon2");
// const argon = require("argon2");

const baseOption = {
    discriminatorKey: "itemtype",
    collection: "items",
};

const baseSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        verifyEmailCode: {
            type: String,
        },
        verifyEmailCodeExpires: {
            type: Date,
        },
        password: {
            type: String,
            select: false,
        },
        passwordChangedAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        passwordResetCode: {
            type: String,
            select: false,
        },
        passwordResetCodeExpires: {
            type: Date,
            select: false,
        },
        username: {
            type: String,
            unique: true,
        },

        favorites: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Media", // Reference to the Media model
            },
        ],

        phoneNumber: {
            type: String,
            unique: [true, "Phone number already exists"],
            sparse: true,
            // partialFilterExpression: { phoneNumber: { $type: "string" } },
        },
        isPhoneNumberVerified: {
            type: Boolean,
            default: false,
        },

        refreshToken: {
            type: String,
            select: false,
        },
        blocked: {
            status: {
                type: Boolean,
                default: false,
            },
            reason: {
                type: String,
            },
            type: {
                type: String,
                enum: ["None", "1 week", "2 weeks", "1 month", "Permanent"],
                default: "None",
            },
            blockedAt: {
                type: Date,
            },
            unblockDate: {
                type: Date,
            },
            manuallyUnblocked: {
                type: Boolean,
                default: false,
            },
        },
        blockHistory: [
            {
                status: Boolean,
                reason: String,
                type: {
                    type: String,
                    enum: ["1 week", "2 weeks", "1 month", "Permanent"],
                },
                blockedAt: Date,
                unblockDate: Date,
                manuallyUnblocked: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
            validate: {
                validator: function (val) {
                    return val < Date.now();
                },
            },
        },
        gender: {
            type: String,
            enum: [
                "male",
                "female",
                "other",
                "non-binary",
                "prefer not to say",
            ],
        },
        profilePicture: {
            url: {
                type: String,
                default:
                    "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png",
            },
            reference: { type: String },
        },
        countryOfResidence: {
            type: String,
        },

        accountType: {
            type: String,
            enum: ["serviceuser", "counsellor", "admin"],
            default: "user",
        },

        deactivationStatus: {
            type: Boolean,
            default: false, // False means the account is active by default
        },
        timeDeactivated: {
            type: Date,
            default: null, // Null means it hasn't been deactivated
        },

        deactivationReason: {
            type: String,
        },
        // Add deleted and timeDeleted
        deleted: {
            type: Boolean,
            default: false, // False means the record is not deleted by default
        },
        timeDeleted: {
            type: Date,
            default: null, // Null means it hasn't been deleted
        },

        deleteReason: {
            type: String,
        },
        privacy: {
            showName: { type: Boolean, default: true },
            showProfilePic: { type: Boolean, default: true },
            showMoodChart: { type: Boolean, default: true },
        },
        notificationSettings: {
            commentReplies: { type: Boolean, default: true },
            likes: { type: Boolean, default: true },
            pushSessionReminders: {
                aMinuteBefore: { type: Boolean, default: true },
                anHourBefore: { type: Boolean, default: true },
                aDayBefore: { type: Boolean, default: true },
            },
            pushSessionReschedule: {
                type: Boolean,
                default: true,
            },
            pushSessionCancellation: {
                type: Boolean,
                default: true,
            },
            emailSessionReminders: {
                aMinuteBefore: { type: Boolean, default: true },
                anHourBefore: { type: Boolean, default: true },
                aDayBefore: { type: Boolean, default: true },
            },
            emailSessionReschedule: {
                type: Boolean,
                default: true,
            },
            emailSessionCancellation: {
                type: Boolean,
                default: true,
            },
            emailSessionRequest: {
                type: Boolean,
                default: true,
            },
            pushSessionRequest: {
                type: Boolean,
                default: true,
            },
            emailSessionAssigned: {
                type: Boolean,
                default: true,
            },
            pushSessionAssigned: {
                type: Boolean,
                default: true,
            },
            pushConvoEngagement: {
                type: Boolean,
                default: true,
            },
            emailConvoEngagement: {
                type: Boolean,
                default: true,
            },
            pushNewConvo: {
                type: Boolean,
                default: true,
            },
            emailNewConvo: {
                type: Boolean,
                default: true,
            },
            pushRescheduleRequest: {
                type: Boolean,
                default: true,
            },
            emailRescheduleRequest: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

baseSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

baseSchema.pre("save", async function (next) {
    if (!this.isModified("refreshToken")) {
        return next();
    }

    this.refreshToken = await argon.hash(this.refreshToken);
    next();
});

baseSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    return JWTTimestamp < parseInt(this.passwordChangedAt.getTime() / 1000);
};
/**
 * Verifies the password provided with the hash stored.
 * @param {String} candidatePassword password provided by user
 * @returns {Boolean}
 */
baseSchema.methods.verifyPassword = async function (candidatePassword) {
    const verify = await argon.verify(this.password, candidatePassword);
    return verify;
};

baseSchema.methods.deactivate = function (reason) {
    this.deactivationStatus = true;
    this.timeDeactivated = new Date(); // Set current time
    this.deactivationReason = reason || null;
    return this.save();
};

baseSchema.methods.activate = function () {
    this.deactivationStatus = false;
    this.timeDeactivated = null; // Clear the deactivation time
    return this.save();
};

baseSchema.methods.softDelete = function (reason) {
    this.deleted = true;
    this.timeDeleted = new Date(); // Set current time
    this.deleteReason = reason || null; // Add the delete reason or set it to null if not provided
    return this.save();
};

baseSchema.methods.restore = function () {
    this.deleted = false;
    this.timeDeleted = null; // Clear the deletion time
    return this.save();
};

baseSchema.methods.updateNotificationSettings = async function (settings) {
    const allowedUpdates = [
        "pushConvoEngagement",
        "emailConvoEngagement",
        "pushNewConvo",
        "emailNewConvo",
        "pushRescheduleRequest",
        "emailRescheduleRequest",
        "commentReplies",
    ];

    // Update only the allowed fields
    Object.keys(settings).forEach((key) => {
        if (allowedUpdates.includes(key)) {
            this.notificationSettings[key] = settings[key];
        }
    });

    return await this.save();
};

module.exports = mongooseV2.model("Users", baseSchema);

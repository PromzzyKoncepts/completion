const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");
const baseModel = require("./Base");

const counsellorSchema = new mongoose.Schema({

    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    bio: {
        type: String,
    },
    qualifications: {
        type: [
            {
                url: {
                    type: String,
                },
                reference: {
                    type: String,
                },
            },
        ],
        default: [],  // Default to an empty array if no qualifications are provided
    },
    pushToken: {
        type: String,
    },

    certificates: [
        {
            type: String,
        },
    ],
    mentalHealthCertificates: [
        {
            name: {
                type: String,
            },
            file: {
                type: String,
            },
        },
    ],
    motivation: {
        type: String,
    },
    rejectionReason: {
        type: String,
    },

    volunteer: {
        roomInfo: {
            type: Object, // all the room info from VideoSDK
            get: function () {
                if (this.volunteer.status !== "approved" || this.blocked) {
                    return undefined; // return undefined if volunteer is not approved
                }
            },
        },
    },
    pinnedTopics: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
        },
    ],
    interestedTopics: [
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
    },
    commencePractice: {
        type: Number,  // Storing the year as a number
    },
    sessionType: {
        type: [String],  // Array to allow for multiple options
        enum: ["video", "call"],
        default: [],
    },
    specialisedSupport: {
        type: [String],
        enum: ["Women Only issues", "Men Only issues", "LGBTQ+ specialist", "Non-Religious", "Religious"],
        default: [],
    },
    schedule: [
        {
            dayOfWeek: {
                type: String,
                enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                required: true,
            },
            availability: [{
                from: {
                    type: String,  // Assuming 'HH:mm' format
                    required: true,
                },
                to: {
                    type: String,  // Assuming 'HH:mm' format
                    required: true,
                },
            }],
        },
    ],
    focusArea: {
        type: [String],  // Array of strings for focus areas
        default: [],
    },
    seeThoughtOfTheDay: {
        type: Boolean,  // Boolean value for true/false
        default: true,
    },
    isVerified: {
        type: Boolean,  // Boolean value for true/false
        default: false,
    }


});

const Counsellor =baseModel.discriminator("Counsellor",counsellorSchema)
module.exports = Counsellor

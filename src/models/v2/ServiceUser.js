const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");
const baseModel = require("./Base");

const serviceUserSchema = new mongoose.Schema({

    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    bio: {
        type: String,
    },

    pushToken: {
        type: String,
    },

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

    intakeQuestionnaireCompleted: {
        type: Boolean,
        default: false,
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

    seeThoughtOfTheDay: {
        type: Boolean,  // Boolean value for true/false
        default: true, 
    }
});

const ServiceUserSchema =baseModel.discriminator("ServiceUser",serviceUserSchema)
module.exports = ServiceUserSchema
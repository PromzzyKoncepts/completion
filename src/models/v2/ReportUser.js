const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");
const { REPORT_ENTITY_TYPES, USER_ROLES, REPORT_STATUSES } = require("../../configs/constants/enums");

const ReportUserSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedEntity: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "entityType", // Dynamic reference
        },
        entityType: {
            type: String,
            enum:REPORT_ENTITY_TYPES,
            required: true,
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUserRole: {
            type: String,
            enum: USER_ROLES,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            enum: REPORT_STATUSES,
            default: "unresolved",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongooseV2.model("ReportUser", ReportUserSchema);

const mongoose = require("mongoose");
const { mongooseV2 } = require("../../configs/database/db");
const baseModel = require("./Base"); // Ensure this is the base model file

// Define Admin Schema
const adminSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["moderator", "superadmin", "admin"],
        default: "admin",
    },
});


// Register Admin model as a discriminator of the base model
const Admin = baseModel.discriminator("Admin", adminSchema);

// Export the Admin model
module.exports = Admin;

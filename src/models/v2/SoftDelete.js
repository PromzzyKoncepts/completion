const mongoose = require('mongoose');
const {mongooseV2} = require("../../configs/database/db");

const softDeleteSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    username: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
})

const SoftDelete = mongooseV2.model('SoftDelete', softDeleteSchema);

module.exports = SoftDelete;
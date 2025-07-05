const mongoose = require("mongoose");
const AppLogger = require("../../middlewares/logger/logger");

const mongooseV2 = mongoose.createConnection();

const connectDatabases = async () => {

    // Connect to V2 MongoDB
    await mongooseV2
        .openUri(process.env.V2_MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        .then(() => AppLogger.info("Connected to V2 MongoDB 🚀"));
};

module.exports = { connectDatabases, mongooseV2 };

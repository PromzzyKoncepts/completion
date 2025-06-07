const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json, errors } = format;
const path = require("path");

require("dotenv").config({
    path: path.join(
        __dirname,
        `../../configs/envs/.env.${process.env.NODE_ENV}`
    ),
});

if (process.env.NODE_ENV === "test") {
    /**
     * For testing, we don't want to log anything to the console or file
     */
    module.exports = {
        info: () => { },
        warn: () => { },
        error: () => { },
        debug: () => { },
        verbose: () => { },
        silly: () => { },
        log: () => { },
    };
} else {
    // file transport options
    const fileOptions = {
        level: "error",
        filename: "./logs/app.log",
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5, // 5 files max of 5MB each
        colorize: false,
    };

    // database transport options
    const dbOptions = {
        level: "error", // only log errors to the database
        db: process.env.MONGO_URI,
        options: {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        },
        collection: "logs",
        format: combine(errors({ stack: true }), timestamp(), json()),
    };

    /**
     * Application logger middleware
     * @description  Logs all application events to the console, file transport in the logs directory and database.
     * @returns {object}  Application logger
     */
    const AppLogger = createLogger({
        transports: [

            // Uncomment to show logs on console
            new transports.Console({
                level: "debug",
                handleExceptions: true,
                colorize: true,
                format: format.combine(
                    format.colorize(),
                    format.timestamp(),
                    format.printf((info) => {
                        if (!info.label) {
                            info.label = "console";
                        }
                        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
                    })
                ),
            }),


            new transports.File(fileOptions),
            // new (require("winston-mongodb").MongoDB)(dbOptions), // Updated the MongoDB transport initialization
        ],
        exitOnError: false,
    });

    module.exports = AppLogger;
}

const validate = require("validate.js");
const dayjs = require("dayjs");
const { ObjectId } = require("mongoose").Types;

validate.extend(validate.validators.datetime, {
    parse: (value, options) => dayjs(value).valueOf(),
    format: (value, options) => {
        const format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
        return dayjs(value).format(format);
    },
});

validate.validators.mongoid = function (value, options, key, attributes) {
    if (!ObjectId.isValid(value)) {
        return "is not a valid objectId";
    }
};

class ValidateSession {
    static createSession(req, res, next) {
        const constraints = {
            name: {
                presence: true,
                length: { minimum: 3 },
            },
            startTime: {
                presence: true,
                datetime: {
                    // earliest: dayjs().valueOf()
                    //   latest: dayjs(req.body.endTime).valueOf()
                },
            },
            endTime: {
                presence: true,
                datetime: { earliest: dayjs(req.body.startTime).valueOf() },
            },
            description: {
                presence: false,
            },
            sessionType: {
                presence: true,
                inclusion: ["session", "listening_ear"],
            },
            user: {
                presence: true,
                mongoid: {},
            },
        };
        const values = { user: req.user.id, ...req.body };
        const hasErrors = validate(values, constraints);
        if (hasErrors) {
            return res.status(400).send({ status: "error", error: hasErrors });
        }
        next();
    }
}

module.exports = { ValidateSession };

const validate = require("validate.js");

const validateTopic = (req, res, next) => {
    const constraints = {
        title: {
            presence: true,
            length: {
                maximum: 50,
                message: "must not exceed 50 characters",
            },
        },
        description: {
            length: { minimum: 10 },
            presence: true,
        },
        category: {
            presence: true,
            length: {
                is: 24,
            },
        },
    };
    const hasErrors = validate(req.body, constraints);
    if (!hasErrors) {
        return next();
    }
    return res.status(400).send({ error: hasErrors });
};

const validateComment = (req, res, next) => {
    const { topic } = req.params;
    const constraints = {
        content: {
            presence: true,
            length: {
                minimum: 1,
            },
        },
        topic: {
            presence: true,
            length: {
                is: 24,
            },
        },
    };
    const hasErrors = validate({ ...req.body, topic }, constraints);
    if (!hasErrors) {
        return next();
    }
    return res.status(400).send({ error: hasErrors });
};

const validateCommentReply = (req, res, next) => {
    const { topic, comment } = req.params;
    const constraints = {
        content: {
            presence: true,
            length: {
                minimum: 1,
            },
        },
        topic: {
            presence: true,
            length: {
                is: 24,
            },
        },
        comment: {
            presence: true,
            length: {
                is: 24,
            },
        },
    };
    const hasErrors = validate({ ...req.body, topic, comment }, constraints);
    if (!hasErrors) {
        return next();
    }
    return res.status(400).send({ error: hasErrors });
};

module.exports = { validateTopic, validateComment, validateCommentReply };

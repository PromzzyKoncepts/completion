const { management } = require("../../configs/auth0/index");

const changeUserPassword = async (req, res, next) => {
    if (req.body.password) {
        await management.updateUser(
            { id: req.user.sub },
            { password: req.body.password },
            function (err, user) {
                if (err) {
                    return res
                        .status(400)
                        .send({ status: "error", message: err.message });
                } else {
                    next();
                }
            }
        );
    } else {

        next();
    }
};

module.exports = { changeUserPassword };

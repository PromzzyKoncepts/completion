const { management } = require("../../../configs/auth0");
const {
    findOneAndDelete,
    findOneAndUpdate,
} = require("../../../models/v1/User");
const User = require("../../../models/v1/User");

class UsersController {
    static async fetchUsers(req, res) {
        await User.find({})
            .select("name blocked dateCreated")
            .lean()
            .exec((err, data) => {
                if (err) {
                    return res.send({ status: "error", message: err.message });
                }
                return res.send({ status: "success", data });
            });
    }

    static async fetchCounsellors(req, res) {
        await User.find({ accountType: "counsellor" })
            .select("name")
            .lean()
            .exec((err, data) => {
                if (err) {
                    return res.send({ status: "error", message: err.message });
                }
                return res.send({ status: "success", data });
            });
    }

    static async fetchUser(req, res) {
        const { id } = req.params;
        await User.findOne({ _id: id })
            .select("name email dateCreated phone")
            .exec((err, data) => {
                if (err) {
                    return res.send({ status: "error", message: err.message });
                }
                return res.send({ status: "success", data });
            });
    }

    static async deleteUser(req, res) {
        const findUser = await User.findOne({ _id: req.params.id });
        const USER_ID = findUser.uuid ? findUser.uuid : `auth0|${findUser._id}`;
        await management.deleteUser({ id: USER_ID }, async function (err) {
            if (err) {
                return res.send({
                    status: "error",
                    message: "unable to delete user",
                });
            }
            await User.findOneAndDelete({ _id: req.params.id }, (err, data) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ status: "error", message: err.message });
                }
                return res.send({
                    status: "success",
                    message: "User Successfully Deleted",
                });
            });
        });
    }

    static async disableUser(req, res) {
        const findUser = await User.findOne({ _id: req.params.id });
        const USER_ID = findUser.uuid ? findUser.uuid : `auth0|${findUser._id}`;
        await management.updateUser(
            { id: USER_ID },
            { blocked: true },
            async function (err) {
           
                if (err) {
                    return res.send({
                        status: "error",
                        message: err.message,
                    });
                }
                await User.findOneAndUpdate(
                    { _id: req.params.id },
                    { blocked: true },
                    (err, data) => {
                        if (err) {
                            
                            return res.status(400).json({
                                status: "error",
                                message: err.message,
                            });
                        }
                        return res.send({
                            status: "success",
                            message: "User has been blocked successfully",
                        });
                    }
                );
            }
        );
    }

    static async enableUser(req, res) {
        const findUser = await User.findOne({ _id: req.params.id });
        const USER_ID = findUser.uuid ? findUser.uuid : `auth0|${findUser._id}`;
        await management.updateUser(
            { id: USER_ID },
            { blocked: false },
            async function (err) {
            
                if (err) {
                    return res.send({
                        status: "error",
                        message: err.message,
                    });
                }
                await User.findOneAndUpdate(
                    { _id: req.params.id },
                    { blocked: false },
                    (err, data) => {
                        if (err) {
                            return res.status(400).json({
                                status: "error",
                                message: err.message,
                            });
                        }
                        return res.send({
                            status: "success",
                            message: "User has been Unblocked successfully",
                        });
                    }
                );
            }
        );
    }
}

module.exports = { UsersController };

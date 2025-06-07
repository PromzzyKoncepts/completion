const Topic = require("../../../models/v1/Topic");

class TopicsController {
    static async fetchTopics(req, res) {
        await Topic.find({})
            .populate("author", "name")
            .populate("category", "name color_code")
            .select("-likes")
            .lean()
            .exec((err, data) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ status: "error", message: err.message });
                }
                return res.send({ status: "success", data });
            });
    }

    static async createTopic(req, res) {
        if (req.body.profilePicture) {
            req.body.image = req.body.profilePicture;
        }
        await Topic.create(req.body, (err, data) => {
            if (err) {
                return res.send({
                    status: "error",
                    message: err.message,
                });
            }
            return res.send({
                status: "success",
                data,
                message: "Topic added successfully",
            });
        });
    }

    static async editTopic(req, res) {
        if (req.body.profilePicture) {
            req.body.image = req.body.profilePicture;
        }
       
        await Topic.findOneAndUpdate(
            { _id: req.params.id },
            req.body,
            { new: true },
            (err, data) => {
                if (err) {
                    return res.send({
                        status: "error",
                        message: err.message,
                    });
                }
                return res.send({
                    status: "success",
                    data,
                    message: "Topic updated successfully",
                });
            }
        );
    }

    static async deleteTopic(req, res) {
        await Topic.findOneAndDelete({ _id: req.params.id }, (err, data) => {
            if (err) {
                return res
                    .status(400)
                    .json({ status: "error", message: err.message });
            }
            return res.send({
                status: "success",
                message: "Topic has been successfully deleted",
            });
        });
    }
}

module.exports = { TopicsController };

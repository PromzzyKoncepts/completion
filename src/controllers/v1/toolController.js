const Tool = require("../../models/v1/Tool");

class ToolController {
    static async addTool(req, res) {
        req.body.user = req.user.id;
        await Tool.create(req.body, (err, data) => {
            if (err) {
                return res.status(400).send({
                    status: "error",
                    message:
                        "Sorry an error occurred  while saving this information. Please check your connection and try again",
                });
            }
            return res.send({
                status: "success",
                data,
                message: "Saved successfully",
            });
        });
    }

    static async fetchTools(req, res) {
        const { code } = req.params;
        await Tool.find({
            "response.toolCode": code,
            user: req.user.id,
        })
            .populate("user", "name email profilePicture")
            .select(
                "user responseDate response.toolCode response.name response.description response.data"
            )
            .sort({ responseDate: -1 })
            .exec((err, data) => {
                if (err) {
                    return res.status(400).send({
                        status: "error",
                        message:
                            "Sorry an error occurred, please check your connection and try again",
                    });
                }
                return res.send({
                    status: "success",
                    message: "Request successful",
                    data,
                });
            });
    }
}

module.exports = { ToolController };

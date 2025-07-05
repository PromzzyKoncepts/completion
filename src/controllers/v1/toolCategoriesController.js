const ToolCategories = require("../../models/v1/ToolCategories");

class ToolCategoriesController {
    static async fetchToolCategories(req, res) {
        await ToolCategories.find({}, (err, categories) => {
            if (err) {
                return res.status(400).send({
                    status: "error",
                    message:
                        "Sorry an error occurred retrieving categories. Please check your connection and try again",
                });
            }
            return res.send({ status: "success", data: categories });
        });
    }
}

module.exports = { ToolCategoriesController };

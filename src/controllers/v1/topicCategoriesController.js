const TopicCategories = require("../../models/v1/TopicCategories");

class TopicCategoriesController {
    static async getCategories(req, res) {
        await TopicCategories.find({}, (err, categories) => {
            if (err) {
                return res.status(400).send({
                    status: "error",
                    message:
                        "Sorry we are unable to retrieve categories at this time. Please check your connection and try again",
                });
            }
            return res.send({ status: "success", data: categories });
        });
    }
}

module.exports = { TopicCategoriesController };

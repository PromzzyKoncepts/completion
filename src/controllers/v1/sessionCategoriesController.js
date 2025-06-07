const SessionCategories = require("../../models/v1/SessionCategories");

class SessionCategoriesController {
    static async getSessionCategories(req, res) {
        await SessionCategories.find({}, (err, categories) => {
            if (err) {
                return res.status(400).send({
                    status: "error",
                    message:
                        "An error occurred. please check your internet and try again",
                });
            }
            return res.send({
                status: "success",
                data: categories,
            });
        });
    }
}

module.exports = { SessionCategoriesController };

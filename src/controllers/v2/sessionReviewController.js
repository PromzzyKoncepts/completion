const SessionReview = require("../../models/v2/SessionReview");
const Factory = require("../../utils/factory");

exports.createReview = async (req, res, next) => {
    Factory.create(SessionReview);
};

exports.getReview = Factory.get(SessionReview);

exports.getAllReviews = Factory.getAll(SessionReview);

exports.updateReview = Factory.update(SessionReview);

exports.deleteReview = Factory.delete(SessionReview);

const SessionCategories = require("../../models/v2/SessionCategories");
const Factory = require("../../utils/factory");

exports.createSessionCategory = Factory.create(SessionCategories);

exports.getAllSessionCategories = Factory.getAll(SessionCategories);

exports.getSessionCategory = Factory.get(SessionCategories);

exports.updateSessionCategory = Factory.update(SessionCategories);

exports.deleteSessionCategory = Factory.delete(SessionCategories);

const IntakeQuestionnaire = require("../../models/v2/IntakeQuestionnaire");
const Factory = require("../../utils/factory");

exports.get = Factory.get(IntakeQuestionnaire);

exports.getAll = Factory.getAll(IntakeQuestionnaire);

exports.create = Factory.create(IntakeQuestionnaire);

exports.update = Factory.update(IntakeQuestionnaire);

exports.delete = Factory.delete(IntakeQuestionnaire);

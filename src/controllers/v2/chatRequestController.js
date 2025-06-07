const ChatRequest = require("../../models/v2/ChatRequest");
const AppLogger = require("../../middlewares/logger/logger");

exports.findChatRequests = async (req, res) => {
  try {
    const chatRequests = await ChatRequest.find({ status: "requested" })
      .populate({
        path: "user",
        select: "-password"
      });

    return res.status(200).json({ chatRequests });
  } catch (error) {
    AppLogger.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

exports.createChatRequest = async (req, res) => {
  try {
    const { _id } = req.user;

    const userRequests = await ChatRequest.find({ user: _id });

    if (userRequests.length > 1) {
      return res.status(400).json({ error: "User has an open chat request" });
    }
    const chatRequest = await ChatRequest.create({ ...req.body, user: _id });

    return res.status(201).json({ chatRequest });
  } catch (error) {
    AppLogger.error(error);
    return res.status(500).json({ error: error.message });
  }
}


exports.acceptChatRequest = async (req, res) => {
  try {
    await ChatRequest.findOneAndUpdate({ _id: req.params.id }, { status: "accepted", counsellor: req.user.id });

    return res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    AppLogger.error(error);
    return res.status(500).json({ error: "Internal server error" })
  }
}

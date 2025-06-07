const express = require("express");
const MoodController = require("../../../controllers/v2/MoodController");
const AuthMiddleware = require("../../../middlewares/v2/auth");
const UserMiddleware = require("../../../middlewares/v2/user");

const router = express.Router();


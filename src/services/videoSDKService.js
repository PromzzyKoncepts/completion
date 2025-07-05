const jwt = require("jsonwebtoken");
const axios = require("axios");
const AppError = require("../utils/appError");
const AppLogger = require("../middlewares/logger/logger");

class VideoSDKService {
    /**
     * Generates VideoSDK API token for creating and accessing rooms(meeting/call).
     * @returns token string
     */
    static #generateToken(permissions = ["allow_join"]) {
        const API_KEY = process.env.VIDEOSDK_API_KEY;
        const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY;

        const options = { algorithm: "HS256" };

        const payload = {
            apikey: API_KEY,
            permissions: permissions,
        };

        /**
         * Details about permissions in the payload above, and those available
         * @allow_join The participant is allowed to join the meeting directly.
         * @ask_join The participant requires to ask for permission to join the meeting.
         * @allow_mod The participant is allowed to toggle webcam & mic of other participants.
         */

        const token = jwt.sign(payload, SECRET_KEY, options);
        return token;
    }

    /**
     * Gets axios config object for VideoSDK API requests
     * @returns config object
     */
    static #getAxiosConfig() {
        return {
            headers: {
                Authorization: this.#generateToken(),
                "Content-Type": "application/json",
            },
        };
    }

    /**
     * Creates a room from VideoSDK API.
     * @returns axios response object if 200 or an object with the field status and data
     * as basic info to know what happened.
     */
    static async createRoom(req, res, next) {
        const config = this.#getAxiosConfig();

        const data = JSON.stringify({
            region: "eu001", // Region Code for Frankfurt, DE,
        });

        const url = `${process.env.VIDEOSDK_API_BASE_URL}/rooms`;

        try {
            const newRoom = await axios.post(url, data, config);
            newRoom.data = Object.assign(newRoom.data, {
                counselorToken: this.#generateToken([
                    "allow_join",
                    "allow_mod",
                ]),
                userToken: this.#generateToken(["ask_join"]),
            });

            const roomInfo = {
                ...newRoom.data,  // Spread the response data
                counselorToken: this.#generateToken(["allow_join", "allow_mod"]),
                userToken: this.#generateToken(["ask_join"])
            };

            return roomInfo;
        } catch (err) {
            AppLogger.error(error);
            if (err.response) {
                return next(
                    new AppError(err.response.data, err.response.status)
                );
            } else if (err.request) {
                return next(new AppError(err.request, 500));
            } else {
                return next(new AppError(err.message, 500));
            }
        }
    }

    /**
     * Creates a room from VideoSDK API, listening to events on the backend.
     * @param {string} webhookEndPoint endpoint for webhooks data. It must start with https:// and accepts POST requests.
     * @param {string[]} eventsSubscribed  list events (for webhooks) to listen, it should not be empty
     * @returns axios response object if 200 or an object with the field status and data
     * as basic info to know what happened.
     */
    static async createRoomWithEvents(req, res, next) {
        const { webhookEndPoint, eventsSubscribed } = req.body;
        const config = this.#getAxiosConfig();

        const data = JSON.stringify({
            region: "eu001", // Region Code for Frankfurt, DE,
            webhook: {
                endPoint: webhookEndPoint,
                events: [...eventsSubscribed],
            },
        });

        const url = `${process.env.VIDEOSDK_API_BASE_URL}/rooms`;
        try {
            return await axios.post(url, data, config);
        } catch (err) {
            if (err.response) {
                return next(
                    new AppError(err.response.data, err.response.status)
                );
            } else if (err.request) {
                return next(new AppError(err.request, 500));
            } else {
                return next(new AppError(err.message, 500));
            }
        }
    }

    /**
     * Validates the provided roomId. It is not required by VideoSDK for every room, but can be used when needed.
     * @param {string} roomId id of room/voice call
     * @returns axios response object if 200 or an object with the field status and data
     * as basic info to know what happened.
     */
    static async validateRoom(req, res, next) {
        const config = this.#getAxiosConfig();
        const roomId = req.params.roomId;
        const url = `${process.env.VIDEOSDK_API_BASE_URL}/rooms/validate/${roomId}`;

        try {
            return await axios.get(url, config);
        } catch (err) {
            if (err.response) {
                return next(
                    new AppError(err.response.data, err.response.status)
                );
            } else if (err.request) {
                return next(new AppError(err.request, 500));
            } else {
                return next(new AppError(err.message, 500));
            }
        }
    }

    /**
     * Fetches a particular room info by passing roomId as parameter.
     * @param {*} roomId id of room/voice call
     * @returns axios response object if 200 or an object with the field status and data
     * as basic info to know what happened.
     */
    static async fetchRoom(req, res, next) {
        const config = this.#getAxiosConfig();
        const roomId = req.params.roomId;
        const url = `${process.env.VIDEOSDK_API_BASE_URL}/rooms/${roomId}`;

        try {
            return await axios.get(url, config);
        } catch (err) {
            if (err.response) {
                return next(
                    new AppError(err.response.data, err.response.status)
                );
            } else if (err.request) {
                return next(new AppError(err.request, 500));
            } else {
                return next(new AppError(err.message, 500));
            }
        }
    }

    /**
     * Fetches all rooms in the account.
     * @param {number} page  page number for the rooms, default is 1.
     * @param {number} perPage number of rooms you want per page, default is 20.
     * @returns all rooms in the field data if 200, or an object with the field status and data
     * as basic info to know what happened.
     */
    static async fecthAllRooms(req, res, next) {
        const config = this.#getAxiosConfig();
        const { page, perPage } = req.query;
        const url = `${process.env.VIDEOSDK_API_BASE_URL}/rooms?page=${page}&perPage=${perPage}`;

        try {
            return await axios.get(url, config);
        } catch (err) {
            if (err.response) {
                return next(
                    new AppError(err.response.data, err.response.status)
                );
            } else if (err.request) {
                return next(new AppError(err.request, 500));
            } else {
                return next(new AppError(err.message, 500));
            }
        }
    }

    /**
     * Deactivate the provided roomId for ever.
     * @param {*} roomId Room id that you want to deactivate
     * @returns data of the deactivated room if 200, or an object with the field status and data
     * as basic info to know what happened.
     */
    static async deactivateRoom(req, res, next) {
        const config = this.#getAxiosConfig();

        const roomId = req.params.roomId;

        const data = JSON.stringify({
            roomId: `${roomId}`,
        });

        const url = `${process.env.VIDEOSDK_API_BASE_URL}/rooms/deactivate`;

        try {
            return await axios.post(url, data, config);
        } catch (err) {
            if (err.response) {
                return next(
                    new AppError(err.response.data, err.response.status)
                );
            } else if (err.request) {
                return next(new AppError(err.request, 500));
            } else {
                return next(new AppError(err.message, 500));
            }
        }
    }
}

module.exports = VideoSDKService;

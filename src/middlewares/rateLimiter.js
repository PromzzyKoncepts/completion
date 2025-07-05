// const rateLimit = require("express-rate-limit");
// const AppError = require("./AppError");

// const createBackoffLimiter = () => {
//     const userBackoffData = {};

//     const limiter = rateLimit({
//         max: (req, res) => {
//             if (userBackoffData[req.ip]) {
//                 return Math.max(1, Math.floor(userBackoffData[req.ip].maxRequests / 2));
//             }

//             return 100;
//         },
//         windowMs: (req, res) => {
//             if (userBackoffData[req.ip]) {
//                 return userBackoffData[req.ip].windowMs * 2;
//             }

//             return 15 * 60 * 1000; // 15 minutes
//         },
//         handler: (req, res, next) => {
//             if (!userBackoffData[req.ip]) {
//                 userBackoffData[req.ip] = {
//                     maxRequests: 100,
//                     windowMs: 15 * 60 * 1000, // 15 minutes
//                 };
//             }

//             userBackoffData[req.ip].maxRequests /= 2;
//             userBackoffData[req.ip].windowMs *= 2;

//             next(new AppError("Too many requests, please try again later", 429));
//         },
//         skipFailedRequests: true,
//         keyGenerator: (req, res) => {
//             return req.user?.id || req.ip;
//         },
//     });

//     return limiter;
// };

// const softLimiter = createBackoffLimiter();

// if (process.env.NODE_ENV !== "development") {
//     app.use("/api", (req, res, next) => {
//         const rateLimitInfo = softLimiter.getHeaders(req, res);
//         if (rateLimitInfo.remaining <= (rateLimitInfo.total * 0.2)) {
//             console.warn(`User ${req.ip} is approaching rate limit.`);
//         }
//         next();
//     });
//     app.use("/api", softLimiter);
// }

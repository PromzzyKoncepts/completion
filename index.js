const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIO = require("socket.io");
const AppError = require("./src/utils/appError");
const AppLogger = require("./src/middlewares/logger/logger");
const HttpLogger = require("./src/middlewares/logger/httpLogger");
const scheduledReminders = require("./src/services/scheduledReminders");
const { SessionController } = require("./src/controllers/v1/sessionController");
const errorController = require("./src/controllers/errorController");
const v1Routes = require("./src/routes/api/v1");
const v2Routes = require("./src/routes/api/v2");
//const mediaRoutes = require("./src/routes/api/mediaRoutes");
const { connectDatabases } = require("./src/configs/database/db");
const Agenda = require("agenda");
const defineAgendaJobs = require("./src/configs/agenda/defineAgendaJobs");
const SessionControllerV2 = require("./src/controllers/v2/sessionController");
const { insertDummyRecords } = require("./experimental/DummyMoodCategoriesGenerator");
const { apiLog } = require("./src/middlewares/v2/apiLog");

const Message = require("./src/models/v2/Messages")
require("dotenv").config();

const jwt = require("jsonwebtoken");

process.on("uncaughtException", (err) => {
  AppLogger.error(
    err ? err.message : "Uncaught exception with no error object"
  );
  AppLogger.error(err ? err.stack : "No stack trace available");
  process.exit(1);
});

if (!process.env.AUTH0_DOMAIN) {
  throw "Make sure you have AUTH0_DOMAIN in your .env file";
}

const app = express();
const httpServer = http.createServer(app);
const options = {
  /* ... */
};
const io = socketIO(httpServer, options);

app.use(HttpLogger);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  handler: () =>
    new AppError("Too many requests, please try again later", 429),
});

if (process.env.NODE_ENV !== "development") {
  app.use("/api", limiter);
}

// const verifyToken = (req, res, next) => {
//     const token = req.headers["authorization"];
//     if (!token) return res.status(403).send({ message: "No token provided." });

//     jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
//       if (err) return res.status(500).send({ message: "Failed to authenticate token." });
//       req.userId = decoded.userId;  // Assign the decoded userId to the request
//       next();
//     });
//   };

// Socket.IO events for real-time messaging
const users = {};

io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, "aaaaaaaaa", (err, decoded) => {

    if (err) return next(new Error("Authentication error"));
    socket.userId = decoded.id;  // Attach the userId to the socket object
    next();
  });
});


io.on("connection", (socket) => {

  users[socket.userId] = socket.id;

  // Check for offline messages from the database
  Message.find({ receiverId: socket.userId, isRead: false }, (err, messages) => {
    if (err) {
      AppLogger.error(err);
    } else if (messages.length > 0) {
      messages.forEach((message) => {
        socket.emit("receiveMessage", message);
      });
      // Mark messages as read after sending
      Message.updateMany({ receiverId: socket.userId, isRead: false }, { isRead: true }, (updateErr) => {
        if (updateErr) {
          AppLogger.error(updateErr);
        }
      });
    }
  });

  // Handle sending messages
  socket.on("sendMessage", async (messageData) => {
    const { senderId, receiverId, message } = JSON.parse(messageData);


    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {

      // If receiver is offline, save the message to the database
      const onlineMessage = new Message({
        senderId,
        receiverId,
        message,
        isRead: true
      });
      try {
        await onlineMessage.save();

      } catch (error) {
        AppLogger.error(error);
      }
      // If receiver is online, send the message directly
      io.to(receiverSocketId).emit("receiveMessage", messageData);
    } else {
      // If receiver is offline, save the message to the database
      const offlineMessage = new Message({
        senderId,
        receiverId,
        message
      });
      try {
        await offlineMessage.save();
      } catch (error) {
        AppLogger.error(error);
      }
    }
  });

  // Handle typing event
  socket.on("isTyping", (typingData) => {
    const { senderId, receiverId, isTyping } = typingData;
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("isTyping", { senderId, isTyping });
    }
  });

  // Remove user from list when they disconnect
  socket.on("disconnect", () => {
    delete users[socket.userId];
  });

  // Nudge user
  socket.on("nudge", (id) => {
    socket.emit("nudge-received").to(id);
  })
});

// Initialize an object to store offline messages
// let offlineMessages = {};



// io.on("connection", (socket) => {
//     AppLogger.info("a user connected");
//     const { channelName, from = "" } = socket.handshake.query;

//     socket.join(channelName);

//     socket.on("chat message", ({ messages }) => {
//         // send push notification to recipient device
//         SessionController.sessionChatNotification({
//             channelName,
//             from,
//             message: messages[0]?.text,
//         });
//         io.to(channelName).emit("chat message", messages);
//     });

//     socket.on("disconnect", () => {
//         AppLogger.info(`disconnect: ${socket.id}`);
//     });
// });

// const townSquareSocket = io.of("/api/v2/townsquare");
// const articleRoutes = require("./src/routes/api/v2/articlesRoutes")(
//     townSquareSocket
// );

// const sessionV2Socket = io.of("/api/v2/sessions");

// sessionV2Socket.on("connection", (socket) => {
//     AppLogger.info("a user connected");
//     const { channelName, from = "" } = socket.handshake.query;

//     socket.join(channelName);

//     socket.on("chat message", ({ messages }) => {
//         // send push notification to recipient device
//         SessionControllerV2.sessionChatNotification({
//             channelName,
//             from,
//             message: messages[0]?.text,
//         });
//         io.to(channelName).emit("chat message", messages);
//     });

//     socket.on("disconnect", () => {
//         AppLogger.info(`disconnect: ${socket.id}`);
//     });
// });

//app.use("/api/v2/townsquare/articles", articleRoutes);
//app.use("/api/media", mediaRoutes);
// Routes
app.use("/api/v1", v1Routes);
app.use("/api/v2", apiLog, v2Routes);


app.get("/", (req, res) => {
  res.send("This is the base project");
});

// Non-implemented routes middleware
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `Can’t find ${req.originalUrl} with ${req.method} method on this server`,
      501
    )
  );
});
// Global error handler
app.use(errorController);

let agenda;
let server;
const run = async () => {
  try {
    agenda = new Agenda({ db: { address: process.env.V2_MONGO_URI } });

    await connectDatabases();
    await agenda.start();
    // TODO: refactor this
    app.set("agenda", agenda);

    defineAgendaJobs(agenda);

    server = httpServer.listen(process.env.PORT, () => {
      AppLogger.info(
        `Positiveo API listening on port ${process.env.PORT} 🔥`
      );
    });

    // Scheduler implementation
    scheduledReminders.start();
  } catch (error) {
    AppLogger.error("Error while starting server:", error);
  }
};

if (require.main === module) {
  run();

  process.on("unhandledRejection", (err) => {
    AppLogger.error(
      err ? err.message : "Unhandled rejection with no error object"
    );

    AppLogger.error(err ? err.stack : "No stack trace available");

    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });
}

module.exports = { app, agenda, httpServer, run };

require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const app = express();
const server = http.createServer(app);

const chatEvents = {
  register: "game:register",
  infoTotalPlayer: "info:total_player",
  createRoom: "game:create_room",
  joinRoom: "game:join_room",
  roomInfo: "game:room_info",
  userClicked: "game:user_click",
  emitClick: "game:someone_clicked",
  gameClear: "game:clear",
  leaveRoom: "game:leave_room",
};

// Mount the router object on the root path
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/.netlify/functions/app", async (req, res, next) => {
  if (res.socket?.server?.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    res.socket.server = server;
    const io = new Server(res.socket.server, {
      path: "/.netlify/functions/app/socketio",
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      // User Clicked Start Game
      socket.on(chatEvents.register, (callBack) => {
        console.log("connected bre~~~~", socket.id);
        io.emit(chatEvents.infoTotalPlayer, 1);
        callBack(socket.id);
      });
    });
  }
  res.json({ udin: "petot" });
  res.end();
});

module.exports.handler = serverless(server);

require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const { Server } = require("socket.io");
const { chatEvents } = require("../../dist/constants/socketEvents");
const app = express();

// Mount the router object on the root path
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/.netlify/functions/app", async (req, res, next) => {
  if (res.socket.server.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server(res.socket.server);
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
  res.end();
});

module.exports.handler = serverless(app);

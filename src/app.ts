import { config } from "dotenv";
import express, { Application, NextFunction, Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import http, { Server } from "http";
import { socketHandler } from "./services/socket/socket";
import cors from "cors";

config();
const PORT = process.env.PORT || 9000;

const app: Application = express();
app.use(cors());
const server: Server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: "*",
  },
});
socketHandler(io);

app.get("/", (_req: Request, res: Response, _next: NextFunction) => {
  res.send("Hello World");
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

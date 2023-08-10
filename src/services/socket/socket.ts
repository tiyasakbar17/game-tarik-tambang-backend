import { Server, Socket } from "socket.io";
import * as I from "./interface";
import { generateUUID } from "../../utils/idGenerator";

export function socketHandler(io: Server) {
  const data: I.IGameData = {};
  let totalOnlinePlayer: number = 0;
  const registeredSocketID: I.RegisteredSocketID = {};

  io.on("connection", (socket: Socket) => {
    // User Disconnected
    socket.on("disconnect", () => {
      console.log("Someone Disconnected bre~~~");
      if (registeredSocketID[socket.id]) {
        delete registeredSocketID[socket.id];
        totalOnlinePlayer -= 1;
        socket.broadcast.emit("info:total_player", totalOnlinePlayer);
      }
    });

    // User Clicked Start Game
    socket.on("game:register", (callBack: I.RegisterCallback) => {
      console.log("connected bre~~~~", socket.id);
      if (registeredSocketID[socket.id]) {
        io.emit("info:total_player", totalOnlinePlayer);
        callBack(socket.id);
      } else {
        registeredSocketID[socket.id] = true;
        totalOnlinePlayer += 1;
        io.emit("info:total_player", totalOnlinePlayer);
        callBack(socket.id);
      }
    });

    // User Create New Room
    socket.on(
      "game:create_room",
      async (props: I.ICreateGameProps, callback: I.CreateGameCallBack) => {
        const { id, name } = props;
        const roomID: string = generateUUID();
        data[roomID] = {
          roomID,
          isPublic: false,
          player1: {
            id,
            name,
          },
          isAvailable: true,
          counter: 0,
        };

        registeredSocketID[id] = roomID;
        await socket.join(roomID);
        callback(roomID);
      }
    );

    // User Join Room
    socket.on(
      "game:join_room",
      async (props: I.IJoinGameProps, callback: I.JoinGameCallback) => {
        const { roomID, id, name } = props;
        // Check Room Availibility
        const roomData: I.IRoom | undefined = data[roomID];
        if (roomData === undefined) {
          return callback(new Error("No Room Found"));
        }
        if (roomData.isAvailable) {
          return callback(new Error("Room is Full"));
        }

        // Register user to the room
        data[roomID].isAvailable = false;
        data[roomID].player2 = {
          id,
          name,
        };
        registeredSocketID[id] = roomID;
        await socket.join(roomID);
        setTimeout(() => {
          const payload: I.IRoomInfo = {
            isReady: true,
            roomData: data[roomID],
          };
          socket.broadcast.to(roomID).emit("game:room_info", payload);
        }, 1000);
      }
    );

    // User Play Game
    socket.on("game:user_click", (props: I.IGameClick) => {
      const { id, roomID } = props;
      const currentValue: I.IRoom = data[roomID];

      const isPlayer1 = currentValue.player1?.id === id;

      data[roomID].counter = data[roomID].counter + (isPlayer1 ? -1 : 1);
      let winner: I.Player;
      switch (data[roomID].counter) {
        case 20:
          winner = data[roomID].player2!;
          break;
        case -20:
          winner = data[roomID].player1!;
          break;
        default:
          const payload: I.IGameSomeoneClicked = {
            counter: data[roomID].counter,
          };
          return socket.broadcast
            .to(roomID)
            .emit("game:someone_clicked", payload);
      }
      socket.broadcast.to(roomID).emit("game:clear", winner);
      delete data[roomID];
    });

    socket.on(
      "game:leave_room",
      (props: I.IGameLeave, callback: I.GameLeaveCallback) => {
        const { roomID } = props;
        registeredSocketID[socket.id] = true;

        // Check Person in Room
        if (data[roomID].player1?.id === socket.id) {
          data[roomID].player1 = undefined;
        } else {
          data[roomID].player2 = undefined;
        }

        data[roomID].isAvailable = true;
        // Check if The room is Empty
        if (!data[roomID].player1 && !data[roomID].player2) {
          delete data[roomID];
          socket.leave(roomID);
          return callback(true);
        }

        const payload: I.IRoomInfo = {
          isReady: false,
          roomData: data[roomID],
        };
        socket.broadcast.to(roomID).emit("game:room_info", payload);
        socket.leave(roomID);
        callback(true);
      }
    );
  });
}

import { Server, Socket } from "socket.io";
import * as I from "./interface";
import { generateUUID } from "../../utils/idGenerator";
import { chatEvents } from "../../constants/socketEvents";

export function socketHandler(io: Server) {
  const data: I.IGameData = {};
  let totalOnlinePlayer: number = 0;
  const registeredSocketID: I.RegisteredSocketID = {};

  io.on("connection", (socket: Socket) => {
    // User Disconnected
    socket.on("disconnect", () => {
      console.log("Someone Disconnected bre~~~");
      if (!registeredSocketID[socket.id]) {
        return;
      }
      const roomID = registeredSocketID[socket.id];
      if (typeof roomID !== "boolean") {
        // Check Person in Room
        if (data[roomID].player1?.id === socket.id) {
          data[roomID].player1 = undefined;
        } else {
          data[roomID].player2 = undefined;
        }

        data[roomID].isAvailable = true;
        // Check if The room is Empty
        if (!data[roomID].player1 && !data[roomID].player2) {
          return delete data[roomID];
        }
        const payload: I.IRoomInfo = {
          isReady: false,
          roomData: data[roomID],
        };
        socket.broadcast.to(roomID).emit(chatEvents.roomInfo, payload);
      }

      // Remove user from data
      delete registeredSocketID[socket.id];
      totalOnlinePlayer -= 1;
      socket.broadcast.emit(chatEvents.infoTotalPlayer, totalOnlinePlayer);
    });

    // User Clicked Start Game
    socket.on(chatEvents.register, (callBack: I.RegisterCallback) => {
      console.log("connected bre~~~~", socket.id);
      if (registeredSocketID[socket.id]) {
        io.emit(chatEvents.infoTotalPlayer, totalOnlinePlayer);
        callBack(socket.id);
      } else {
        registeredSocketID[socket.id] = true;
        totalOnlinePlayer += 1;
        io.emit(chatEvents.infoTotalPlayer, totalOnlinePlayer);
        callBack(socket.id);
      }
    });

    // User Create New Room
    socket.on(
      chatEvents.createRoom,
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
      chatEvents.joinRoom,
      async (props: I.IJoinGameProps, callback: I.JoinGameCallback) => {
        const { roomID, id, name } = props;
        // Check Room Availibility
        const roomData: I.IRoom | undefined = data[roomID];
        if (roomData === undefined) {
          return callback("No Room Found");
        }
        if (!roomData.isAvailable) {
          return callback("Room is Full");
        }

        // Register user to the room
        data[roomID].isAvailable = false;
        if (!data[roomID].player1) {
          data[roomID].player1 = {
            id,
            name,
          };
        } else {
          data[roomID].player2 = {
            id,
            name,
          };
        }
        data[roomID].counter = 0;
        registeredSocketID[id] = roomID;
        try {
          await socket.join(roomID);
        } catch (error) {
          console.log(error);
        }
        callback(null);
        setTimeout(() => {
          const payload: I.IRoomInfo = {
            isReady: true,
            roomData: data[roomID],
          };
          io.to(roomID).emit(chatEvents.roomInfo, payload);
        }, 1000);
      }
    );

    // User Play Game
    socket.on(chatEvents.userClicked, (props: I.IGameClick) => {
      const { id, roomID } = props;
      const currentValue: I.IRoom = data[roomID];

      const isPlayer1 = currentValue.player1?.id === id;

      data[roomID].counter = data[roomID].counter + (isPlayer1 ? 1 : -1);
      let winner: I.Player;
      switch (data[roomID].counter) {
        case -20:
          winner = data[roomID].player2!;
          break;
        case 20:
          winner = data[roomID].player1!;
          break;
        default:
          const payload: I.IGameSomeoneClicked = {
            counter: data[roomID].counter,
          };
          return socket.broadcast
            .to(roomID)
            .emit(chatEvents.emitClick, payload);
      }
      socket.broadcast.to(roomID).emit(chatEvents.gameClear, winner);
    });

    socket.on(
      chatEvents.leaveRoom,
      (props: I.IGameLeave, callback: I.GameLeaveCallback) => {
        const { roomID, id } = props;
        registeredSocketID[id] = true;

        // Check Person in Room
        if (data[roomID]?.player1?.id === id) {
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
        socket.broadcast.to(roomID).emit(chatEvents.roomInfo, payload);
        socket.leave(roomID);
        callback(true);
      }
    );
  });
}

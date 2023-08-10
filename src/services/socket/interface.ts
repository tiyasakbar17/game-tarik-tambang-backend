export interface RegisteredSocketID {
  [key: string]: boolean | string;
}

export interface Player {
  id: string;
  name: string;
}

export interface IRoom {
  roomID: string;
  player1?: Player;
  player2?: Player;
  isPublic: boolean;
  isAvailable: boolean;
  counter: number;
}

export interface IGameData {
  [key: string]: IRoom;
}
export type RegisterCallback = (id: string) => void;

export interface ICreateGameProps {
  id: string;
  name: string;
}

export type CreateGameCallBack = (roomID: string) => void;

export interface IJoinGameProps {
  roomID: string;
  id: string;
  name: string;
}

export type JoinGameCallback = (err: null | Error) => void;

export interface IRoomInfo {
  isReady: boolean;
  roomData: IRoom;
}

export interface IGameClick {
  roomID: string;
  id: string;
}

export interface IGameLeave {
  roomID: string;
}

export type GameLeaveCallback = (isLeaving: boolean) => void;

export interface IGameSomeoneClicked {
  counter: number;
}

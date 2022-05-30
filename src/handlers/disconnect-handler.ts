import { Socket } from "socket.io";
import { GameData } from "../models/game-data";

export const handleDisconnect = (socketClient: Socket, gameData: GameData) => {
    delete gameData[socketClient.id];

    socketClient.disconnect();
};

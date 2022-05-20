import { Socket } from "socket.io";
import { Config } from "../models/config";
import { GameData } from "../models/game-data";
import { PlayerHandler } from "./player-handler";

export const handleInGame = (socketClient: Socket, gameData: GameData, config: Config) => {
    gameData[socketClient.id] = new PlayerHandler(config.defaultBalance, socketClient.emit);

    socketClient.emit("config", config);
};

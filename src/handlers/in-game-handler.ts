import { Socket } from "socket.io";
import { Config } from "../models/config";
import { GameData } from "../models/game-data";
import { PlayerHandler } from "./player-handler";

export const handleInGame = (socketClient: Socket, gameData: GameData, config: Config) => {
    const { betLevels, betMultiplier, oddsByCounts, freeSpins: freeSpinsConfig, coinValues } = config.cascadingSlotsConfig;
    const player = new PlayerHandler(config.defaultBalance, (payload) => socketClient.emit(config.name, payload));
    const gameConfigs = {
        coinValues,
        betLevels,
        betMultiplier,
        odds: { symbols: oddsByCounts, freespin: freeSpinsConfig },
    };

    gameData[socketClient.id] = player;

    socketClient.emit(config.name, {
        gameConfigs,
        freeSpins: [],
        user: {
            balance: config.defaultBalance,
            rate: 1,
            multiplier: 0,
        },
    });
};

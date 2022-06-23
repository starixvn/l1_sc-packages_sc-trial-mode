import { Socket } from "socket.io";
import { Config, GameData } from "../models";
import { PlayerHandler } from "./";
import { TrialConfigs } from "../trial-configs";

export const handleInGame = (socketClient: Socket, gameData: GameData, config: Config) => {
    const { betLevels, betMultiplier, oddsByCounts, freeSpins: freeSpinsConfig } = config.cascadingSlotsConfig;
    const player = new PlayerHandler(config, (payload) => socketClient.emit(config.name, payload));
    const gameConfigs = {
        coinValues: TrialConfigs.coinValues,
        betLevels,
        betMultiplier,
        maxWinPerRound: TrialConfigs.maxWinPerRound,
        odds: { symbols: oddsByCounts, freeSpins: freeSpinsConfig },
    };

    gameData[socketClient.id] = player;

    socketClient.emit(config.name, {
        gameConfigs,
        freeSpins: [],
        totalMultiplier: 0,
        trialUser: {
            balance: config.defaultBalance ?? TrialConfigs.defaultBalance,
            rate: 1,
            multiplier: 1,
        },
    });
};

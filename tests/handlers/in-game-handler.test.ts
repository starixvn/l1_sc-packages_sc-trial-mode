import { handleInGame } from "../../src/handlers/in-game-handler";
import { Chance } from "chance";
import { Config } from "../../src/models/config";
import { PlayerHandler } from "../../src/handlers/player-handler";
import { TrialConfigs } from "../../src/trial-configs";

describe("inGameHandler", () => {
    const chance = new Chance();
    const socketClientId = chance.guid();
    const socketClient = { id: socketClientId, emit: jest.fn() };
    const gameData = {};
    const config = { name: chance.string(), cascadingSlotsConfig: {} } as Config;

    it("should assign player info to ingame data", () => {
        // Arrange
        const expectResult = new PlayerHandler(config, expect.any(Function));

        // Act
        handleInGame(socketClient as any, gameData, config);

        // Assert
        expect(gameData[socketClient.id]).toStrictEqual(expectResult);
    });

    it("should emit config to client", () => {
        // Act
        handleInGame(socketClient as any, gameData, config);

        // Assert
        expect(socketClient.emit).toBeCalledWith(config.name, {
            gameConfigs: {
                coinValues: TrialConfigs.coinValues,
                betLevels: config.cascadingSlotsConfig.betLevels,
                betMultiplier: config.cascadingSlotsConfig.betMultiplier,
                odds: { symbols: config.cascadingSlotsConfig.oddsByCounts, freeSpins: config.cascadingSlotsConfig.freeSpins },
                maxWinPerRound: TrialConfigs.maxWinPerRound,
            },
            totalMultiplier: 0,
            freeSpins: [],
            trialUser: {
                balance: TrialConfigs.defaultBalance,
                rate: 1,
                multiplier: 1,
            },
        });
    });
});

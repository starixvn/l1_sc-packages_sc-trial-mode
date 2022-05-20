import { handleInGame } from "../../handlers/in-game-handler";
import { Chance } from "chance";
import { Config } from "../../models/config";
import { PlayerHandler } from "../../handlers/player-handler";

describe("inGameHandler", () => {
    const chance = new Chance();
    const socketClientId = chance.guid();
    const socketClient = { id: socketClientId, emit: jest.fn() };
    const gameData = {};
    const config = { defaultBalance: chance.natural() } as Config;

    it("should assign player info to ingame data", () => {
        // Arrange
        const expectResult = new PlayerHandler(config.defaultBalance, socketClient.emit);

        // Act
        handleInGame(socketClient as any, gameData, config);

        // Assert
        expect(gameData[socketClient.id]).toStrictEqual(expectResult);
    });

    it("should emit config to client", () => {
        // Act
        handleInGame(socketClient as any, gameData, config);

        // Assert
        expect(socketClient.emit).toBeCalledWith("config", config);
    });
});

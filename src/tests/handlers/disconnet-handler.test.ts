import { handleDisconnect } from "../../handlers/disconnect-handler";
import { Chance } from "chance";

describe("disconnectHandler", () => {
    const chance = new Chance();

    describe("handleDisconnect", () => {
        const socketClientId = chance.guid();
        const gameData = { [socketClientId]: {} };
        const socketClient = { emit: jest.fn(), id: socketClientId };

        it("should delete player data on game data", () => {
            // Act
            handleDisconnect(socketClient as any, gameData as any);

            // Assert
            expect(gameData[socketClientId]).toBe(undefined);
        });

        it("should emit disconnect to client", () => {
            // Act
            handleDisconnect(socketClient as any, gameData as any);

            // Assert
            expect(socketClient.emit).toBeCalledWith("disconnect", true);
        });
    });
});

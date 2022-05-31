import { handleSignIn } from "../../src/handlers";
import { Chance } from "chance";
import { Config } from "../../src/models/config";

describe("signInHandler", () => {
    const chance = new Chance();

    describe("handleSignIn", () => {
        const socketClientId = chance.guid();
        const configs = { name: chance.string() };
        const socketClient = { emit: jest.fn(), id: socketClientId };

        it("should emit signedIn", () => {
            // Act
            handleSignIn(socketClient as any, configs as Config);

            // Assert
            expect(socketClient.emit).toBeCalledWith(configs.name, "signedIn");
        });

        it("should emit toGame", () => {
            // Act
            handleSignIn(socketClient as any, configs as Config);

            // Assert
            expect(socketClient.emit).toBeCalledWith("message", { toGame: configs.name });
        });
    });
});

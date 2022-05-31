import { handlePlaceBet } from "../../src/handlers";
import { PlayerHandler } from "../../src/handlers/player-handler";
import noticeHelper from "../../src/helpers/notice-helper";
import { Chance } from "chance";

jest.mock("../../src/handlers/player-handler");

describe("placeBetHandler", () => {
    const chance = new Chance();
    const player = new PlayerHandler(2000, jest.fn());
    const socketClient = { id: chance.guid(), emit: jest.fn() };
    const gameData = { [socketClient.id]: player };

    describe("when player is NOT valid", () => {
        it("should not call placeBet", () => {
            // Act
            handlePlaceBet(socketClient as any, { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: chance.bool() }, {});

            // Assert
            expect(player.placeBet).not.toBeCalled();
        });
    });

    describe("when payload NOT is valid", () => {
        it("should not call placeBet", () => {
            // Act
            handlePlaceBet(socketClient as any, undefined, gameData);

            // Assert
            expect(player.placeBet).not.toBeCalled();
        });

        it("should emit error to client", () => {
            // Act
            handlePlaceBet(socketClient as any, undefined, gameData);

            // Assert
            expect(player.emitMessage).toBeCalledWith({ errorCode: noticeHelper.invalidBet });
        });
    });

    describe("when params is valid", () => {
        it("should call player.placeBet", () => {
            // Arrange
            const payload = { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: chance.bool() };

            // Act
            handlePlaceBet(socketClient as any, payload, gameData);

            // Assert
            expect(player.placeBet).toBeCalledWith(payload);
        });
    });
});

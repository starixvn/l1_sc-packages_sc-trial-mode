import { handlePlaceBet } from "../../handlers";
import { PlayerHandler } from "../../handlers/player-handler";
import noticeHelper from "../../helpers/notice-helper";
import { Chance } from "chance";

jest.mock("../../handlers/player-handler");

describe("placeBetHandler", () => {
    const chance = new Chance();
    const player = new PlayerHandler(2000, jest.fn());

    describe("when player is NOT valid", () => {
        it("should not call placeBet", () => {
            // Act
            handlePlaceBet({ payload: { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: chance.bool() }, player: undefined });

            // Assert
            expect(player.placeBet).not.toBeCalled();
        });
    });

    describe("when payload NOT is valid", () => {
        it("should not call placeBet", () => {
            // Act
            handlePlaceBet({ payload: undefined, player });

            // Assert
            expect(player.placeBet).not.toBeCalled();
        });

        it("should emit error to client", () => {
            // Act
            handlePlaceBet({ payload: undefined, player: player });

            // Assert
            expect(player.emitMessage).toBeCalledWith({ errorCode: noticeHelper.invalidBet });
        });
    });

    describe("when params is valid", () => {
        it("should call player.placeBet", () => {
            // Arrange
            const payload = { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: chance.bool() };

            // Act
            handlePlaceBet({ payload, player });

            // Assert
            expect(player.placeBet).toBeCalledWith(payload);
        });
    });
});

import { FreeSpinHandler, GameRoundHandler } from "../../src/handlers";
import { CascadingSlotsConfig, RoundCalculator } from "../../src/models";
import { Chance } from "chance";

describe("gameRoundHandler", () => {
    jest.mock("../../src/handlers/free-spin-handler");

    const chance = new Chance();
    const cascadingSlotsConfig = { bigWinRatio: 2.5, betMultiplier: 20, oddsByCounts: {}, freeSpins: {} } as CascadingSlotsConfig;
    const freeSpinHandler = new FreeSpinHandler();

    let handler: GameRoundHandler;

    beforeEach(() => {
        handler = new GameRoundHandler(freeSpinHandler, cascadingSlotsConfig);
    });

    describe("settle", () => {
        const bet = {
            betLevel: chance.natural(),
            coinValue: chance.natural(),
            freeSpin: chance.bool(),
        };

        const roundCalculator: RoundCalculator = { processSpinning: jest.fn() };

        beforeEach(() => {
            handler["generateRoundFromBet"] = jest.fn();
            handler["collectFreeSpins"] = jest.fn();
            handler["collectTotalMultiplier"] = jest.fn();
            handler["collectRoundResult"] = jest.fn();
        });

        it("should call generateRoundFromBet", async () => {
            // Act
            await handler.settle(bet, roundCalculator);

            // Assert
            expect(handler["generateRoundFromBet"]).toBeCalledWith(bet);
        });

        it("should call roundCalculator.processSpinning", async () => {
            // Arrange
            const mockRound = { ...bet, roundId: chance.natural() };
            const totalMultiplier = chance.natural();
            freeSpinHandler.getCurrentTotalMultiplier = jest.fn().mockReturnValueOnce(totalMultiplier);
            handler["generateRoundFromBet"] = jest.fn().mockReturnValueOnce(mockRound);

            // Act
            await handler.settle(bet, roundCalculator);

            // Assert
            expect(roundCalculator.processSpinning).toBeCalledWith(mockRound, totalMultiplier);
        });

        it("should call collectFreeSpins", async () => {
            // Act
            await handler.settle(bet, roundCalculator);

            // Assert
            expect(handler["collectFreeSpins"]).toBeCalled();
        });

        it("should call collectTotalMultiplier", async () => {
            // Act
            await handler.settle(bet, roundCalculator);

            // Assert
            expect(handler["collectTotalMultiplier"]).toBeCalled();
        });

        it("should return round result", async () => {
            // Arrange
            const roundResult = chance.string();
            handler["collectRoundResult"] = jest.fn().mockReturnValueOnce(roundResult);

            // Act
            const actualResult = await handler.settle(bet, roundCalculator);

            // Assert
            expect(actualResult).toBe(roundResult);
        });
    });
});

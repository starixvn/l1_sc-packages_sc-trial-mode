import { FreeSpinHandler, GameRoundHandler } from "../../src/handlers";
import { CascadingSlotsConfig, RoundCalculator } from "../../src/models";
import { Chance } from "chance";
import { TrialConfigs } from "../../src/trial-configs";

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

        const mockRound = { ...bet, roundId: chance.natural(), totalAmount: chance.natural() };
        const roundCalculator: RoundCalculator = { processSpinning: jest.fn() };

        beforeEach(() => {
            handler["generateRoundFromBet"] = jest.fn().mockReturnValueOnce(mockRound);
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
            const totalMultiplier = chance.natural();
            const maxWinPerRound = parseFloat((TrialConfigs.maxWinPerRound * mockRound.totalAmount).toFixed(2));
            freeSpinHandler.getCurrentTotalMultiplier = jest.fn().mockReturnValueOnce(totalMultiplier);

            // Act
            await handler.settle(bet, roundCalculator);

            // Assert
            expect(roundCalculator.processSpinning).toBeCalledWith(mockRound, totalMultiplier, maxWinPerRound);
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

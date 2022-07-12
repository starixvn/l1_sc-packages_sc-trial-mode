import { FreeSpinHandler, GameRoundHandler } from "../../src/handlers";
import { CascadingSlotsConfig, Round, RoundCalculator } from "../../src/models";
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

    describe("collectFreeSpins", () => {
        beforeEach(() => {
            freeSpinHandler.gainFreeSpins = jest.fn();
        });

        describe("when have no new freeSpin", () => {
            it("should NOT call gainFreeSpins", () => {
                // Arrange
                const round = {
                    betLevel: chance.natural(),
                    coinValue: chance.natural(),
                    settlementResult: {
                        freeSpins: {
                            odds: 0,
                        },
                        additionalFreeSpins: {
                            odds: 0,
                        },
                    },
                } as Round;

                // Act
                handler["collectFreeSpins"](round);

                // Assert
                expect(freeSpinHandler.gainFreeSpins).not.toBeCalled();
            });
        });

        describe("when have new freeSpin", () => {
            it("should call gainFreeSpins", () => {
                // Arrange
                const round = {
                    betLevel: chance.natural(),
                    coinValue: chance.natural(),
                    settlementResult: {
                        freeSpins: {
                            odds: 0,
                        },
                        additionalFreeSpins: {
                            odds: 1,
                        },
                    },
                } as Round;
                const expectedResult = {
                    betLevel: round.betLevel,
                    coinValue: round.coinValue,
                    available: 1,
                };

                // Act
                handler["collectFreeSpins"](round);

                // Assert
                expect(freeSpinHandler.gainFreeSpins).toBeCalledWith(expectedResult);
            });
        });
    });

    describe("collectTotalMultiplier", () => {
        beforeEach(() => {
            freeSpinHandler.increaseTotalMultiplier = jest.fn();
        });

        describe("when bet is NOT win", () => {
            it("should NOT call freeSpinHandler.increaseTotalMultiplier", () => {
                // Arrange
                const round = {
                    betwin: 0,
                    multiplier: 2,
                } as Round;

                // Act
                handler["collectTotalMultiplier"](round);

                // Assert
                expect(freeSpinHandler.increaseTotalMultiplier).not.toBeCalled();
            });
        });

        describe("when bet is win", () => {
            it("should call freeSpinHandler.increaseTotalMultiplier", () => {
                // Arrange
                const round = {
                    betwin: 100,
                    multiplier: 2,
                } as Round;

                // Act
                handler["collectTotalMultiplier"](round);

                // Assert
                expect(freeSpinHandler.increaseTotalMultiplier).toBeCalledWith(round.multiplier);
            });
        });
    });
});

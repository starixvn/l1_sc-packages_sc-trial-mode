import { PlayerHandler } from "../../src/handlers/player-handler";
import { Bet } from "../../src/models/bet";
import { Chance } from "chance";
import { User } from "../../src/models/game-data";
import { CascadingSlotsConfig, Config } from "../../src/models/config";
import { RoundCalculator } from "../../src/models";
import noticeHelper from "../../src/helpers/notice-helper";

jest.mock("../../src/handlers/free-spin-handler");
jest.mock("../../src/handlers/game-round-handler");

const chance = new Chance();

const user: User = {
    balance: chance.natural(),
    emit: jest.fn(),
};
const cascadingSlotsConfig = {
    betMultiplier: 20,
    betLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    coinValues: [0.1, 0.5, 1],
} as CascadingSlotsConfig;
const config = {
    cascadingSlotsConfig,
} as Config;

let handler = new PlayerHandler(config, user.emit);

describe("playerHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        handler = new PlayerHandler(config, user.emit);
    });

    describe("placeBet", () => {
        it("should call betQueue.push", () => {
            // Arrange
            const bet: Bet = { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: chance.bool() };
            handler["betQueue"].push = jest.fn();

            // Act
            handler.placeBet(bet);

            // Assert
            expect(handler["betQueue"].push).toBeCalledWith(bet);
        });
    });

    describe("isHavingBet", () => {
        it("should return true when having bet", () => {
            // Arrange
            handler["betQueue"].length = 1;

            // Act
            const actualResult = handler.isHavingBet();

            // Assert
            expect(actualResult).toBeTruthy();
        });
    });

    describe("dequeueBets", () => {
        const roundCalculator = {} as RoundCalculator;
        const logError = jest.fn();

        beforeEach(() => {
            handler["getBetFromQueue"] = jest.fn();
            handler["validateBet"] = jest.fn();
            handler["emitMessage"] = jest.fn();
        });

        it("should call getBetFromQueue", async () => {
            // Act
            await handler.dequeueBets(roundCalculator, logError);

            // Assert
            expect(handler["getBetFromQueue"]).toBeCalled();
        });

        describe("when bet is valid", () => {
            beforeEach(() => {
                handler["validateBet"] = jest.fn().mockReturnValueOnce(true);
                handler["gameRoundHandler"].settle = jest.fn();
            });

            describe("when bet is using freeSpin", () => {
                it("should call freeSpinHandler.useFreeSpin", async () => {
                    // Arrange
                    handler["getBetFromQueue"] = jest.fn().mockReturnValueOnce({ freeSpin: true });
                    handler["gameRoundHandler"].settle = jest.fn().mockResolvedValueOnce({});

                    // Act
                    await handler.dequeueBets(roundCalculator, logError);

                    // Assert
                    expect(handler["freeSpinHandler"].useFreeSpin).toBeCalled();
                });
            });

            describe("when bet is normal bet", () => {
                it("should deduct balance", async () => {
                    // Arrange
                    const mockBet = { freeSpin: false, betLevel: chance.natural(), coinValue: chance.natural() };
                    const betAmount = mockBet.betLevel * mockBet.coinValue * cascadingSlotsConfig.betMultiplier;
                    const currentBalance = handler["balance"];
                    handler["getBetFromQueue"] = jest.fn().mockReturnValueOnce(mockBet);

                    // Act
                    await handler.dequeueBets(roundCalculator, logError);

                    // Assert
                    expect(handler["balance"]).toBe(currentBalance - betAmount);
                });
            });

            it("should emit endBet to client", async () => {
                // Arrange
                const mockBet = { freeSpin: false, betLevel: chance.natural(), coinValue: chance.natural() };
                const betAmount = mockBet.betLevel * mockBet.coinValue * cascadingSlotsConfig.betMultiplier;
                handler["getBetFromQueue"] = jest.fn().mockReturnValueOnce(mockBet);

                // Act
                await handler.dequeueBets(roundCalculator, logError);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({
                    endBet: betAmount,
                    freeSpin: mockBet.freeSpin,
                    trialUser: { balance: handler["balance"] },
                });
            });

            it("should call gameRoundHandler.settle", async () => {
                // Arrange
                const mockBet = { freeSpin: false, betLevel: chance.natural(), coinValue: chance.natural() };
                handler["getBetFromQueue"] = jest.fn().mockReturnValueOnce(mockBet);

                // Act
                await handler.dequeueBets(roundCalculator, logError);

                // Assert
                expect(handler["gameRoundHandler"].settle).toBeCalledWith(mockBet, roundCalculator);
            });

            it("should emit settle result to client", async () => {
                // Arrange
                const mockResult = { win: chance.natural() };
                const mockBet = { freeSpin: false, betLevel: chance.natural(), coinValue: chance.natural() };
                handler["getBetFromQueue"] = jest.fn().mockReturnValueOnce(mockBet);
                handler["gameRoundHandler"].settle = jest.fn().mockReturnValueOnce(mockResult);

                // Act
                await handler.dequeueBets(roundCalculator, logError);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({ finish: mockResult, trialUser: { balance: handler["balance"] } });
            });
        });
    });

    describe("getBetFromQueue", () => {
        const mockBet = { freeSpin: false, betLevel: chance.natural(), coinValue: chance.natural() };

        beforeEach(() => {
            handler["betQueue"].shift = jest.fn().mockReturnValueOnce(mockBet);
        });

        it("should call betQueue.shift", () => {
            // Act
            handler["getBetFromQueue"]();

            // Assert
            expect(handler["betQueue"].shift).toBeCalled();
        });

        it("should call freeSpinHandler.getAvailableFreeSpins", () => {
            // Act
            handler["getBetFromQueue"]();

            // Assert
            expect(handler["freeSpinHandler"].getAvailableFreeSpins).toBeCalled();
        });

        describe("when bet is freeSpins", () => {
            const freeSpinBet = { freeSpin: true, betLevel: chance.natural(), coinValue: chance.natural() };

            beforeEach(() => {
                handler["freeSpinHandler"].getAvailableFreeSpins = jest.fn().mockReturnValueOnce(1);
                handler["freeSpinHandler"].getFreeSpinData = jest.fn().mockReturnValueOnce(freeSpinBet);
            });

            it("should call freeSpinHandler.getFreeSpinData", () => {
                // Act
                handler["getBetFromQueue"]();

                // Assert
                expect(handler["freeSpinHandler"].getFreeSpinData).toBeCalled();
            });

            it("should return freeSpin bet info", () => {
                // Act
                const actualResult = handler["getBetFromQueue"]();

                // Assert
                expect(actualResult).toStrictEqual(freeSpinBet);
            });
        });

        describe("when bet is normal bet", () => {
            const bet = { freeSpin: true, betLevel: chance.natural(), coinValue: chance.natural() };

            beforeEach(() => {
                handler["betQueue"].shift = jest.fn().mockReturnValueOnce(bet);
            });

            it("should call resetTotalMultiplier", () => {
                // Act
                handler["getBetFromQueue"]();

                // Assert
                expect(handler["freeSpinHandler"].resetTotalMultiplier).toBeCalled();
            });

            it("should return bet", () => {
                // Act
                const actualResult = handler["getBetFromQueue"]();

                // Assert
                expect(actualResult).toStrictEqual(bet);
            });
        });
    });

    describe("composeValidationCriteria", () => {
        describe("when bet is processing", () => {
            it("should return error cannot place bet", () => {
                // Arrange
                const bet = {} as Bet;
                handler["isProcessing"] = true;

                // Act
                const actualResult = handler["composeValidationCriteria"](bet);

                // Assert
                expect(actualResult.find((criterion) => criterion.failure)).toStrictEqual({
                    failure: true,
                    errorCode: noticeHelper.cannotPlaceBet,
                });
            });

            afterAll(() => {
                handler["isProcessing"] = false;
            });
        });

        describe("when bet is freeSpin and having no freeSpin", () => {
            it("should return error invalid free spins", () => {
                // Arrange
                const bet = { freeSpin: true } as Bet;
                handler["freeSpinHandler"].getAvailableFreeSpins = jest.fn().mockReturnValueOnce(0);

                // Act
                const actualResult = handler["composeValidationCriteria"](bet);

                // Assert
                expect(actualResult.find((criterion) => criterion.failure)).toStrictEqual({
                    failure: true,
                    errorCode: noticeHelper.invalidFreeSpin,
                });
            });
        });

        describe("when bet level is not valid", () => {
            it("should return error invalid bet", () => {
                // Arrange
                const bet = { freeSpin: false, betLevel: 20, coinValue: chance.pickone(cascadingSlotsConfig.coinValues) } as Bet;

                // Act
                const actualResult = handler["composeValidationCriteria"](bet);

                // Assert
                expect(actualResult.find((criterion) => criterion.failure)).toStrictEqual({
                    failure: true,
                    errorCode: noticeHelper.invalidBet,
                });
            });
        });

        describe("when coin value is not valid", () => {
            it("should return error invalid bet", () => {
                // Arrange
                const bet = { freeSpin: false, betLevel: chance.pickone(cascadingSlotsConfig.betLevels), coinValue: 11 } as Bet;

                // Act
                const actualResult = handler["composeValidationCriteria"](bet);

                // Assert
                expect(actualResult.find((criterion) => criterion.failure)).toStrictEqual({
                    failure: true,
                    errorCode: noticeHelper.invalidBet,
                });
            });
        });

        describe("when having not enough balance and bet is not freeSpin", () => {
            it("should return error invalid bet", () => {
                // Arrange
                const bet = {
                    freeSpin: false,
                    betLevel: chance.pickone(cascadingSlotsConfig.betLevels),
                    coinValue: chance.pickone(cascadingSlotsConfig.coinValues),
                } as Bet;
                handler["balance"] = 0;

                // Act
                const actualResult = handler["composeValidationCriteria"](bet);

                // Assert
                expect(actualResult.find((criterion) => criterion.failure)).toStrictEqual({
                    failure: true,
                    errorCode: noticeHelper.notEnoughMoney,
                });
            });
        });

        describe("when having not enough balance and bet is freeSpin", () => {
            it("should return result with no failure", () => {
                // Arrange
                const bet = {
                    freeSpin: true,
                    betLevel: chance.pickone(cascadingSlotsConfig.betLevels),
                    coinValue: chance.pickone(cascadingSlotsConfig.coinValues),
                } as Bet;
                handler["balance"] = 0;

                // Act
                const actualResult = handler["composeValidationCriteria"](bet);

                // Assert
                expect(actualResult.find((criterion) => criterion.failure)).toBe(undefined);
            });
        });
    });

    describe("validateBet", () => {
        const bet = {} as Bet;

        beforeEach(() => {
            handler["composeValidationCriteria"] = jest.fn().mockReturnValueOnce([]);
            handler["emitMessage"] = jest.fn();
        });

        it("should call freeSpinHandler.getAvailableFreeSpins", () => {
            // Act
            handler["validateBet"](bet);

            // Assert
            expect(handler["freeSpinHandler"].getAvailableFreeSpins).toBeCalled();
        });

        describe("when bet is free spin and having available free spin", () => {
            it("should return true", () => {
                // Arrange
                const mockBet = { freeSpin: true } as Bet;
                handler["freeSpinHandler"].getAvailableFreeSpins = jest.fn().mockReturnValueOnce(1);

                // Act
                const actualResult = handler["validateBet"](mockBet);

                // Assert
                expect(actualResult).toBeTruthy();
            });
        });

        describe("when having failed criterion", () => {
            const fakeErrorCode = chance.pickone(Object.values(noticeHelper));

            beforeEach(() => {
                handler["composeValidationCriteria"] = jest.fn().mockReturnValueOnce([{ failure: true, errorCode: fakeErrorCode }]);
            });

            it("should emit bet failed", () => {
                // Act
                handler["validateBet"](bet);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({ endBet: -1, errorCode: fakeErrorCode });
            });

            it("should return false", () => {
                // Act
                const actualResult = handler["validateBet"](bet);

                // Assert
                expect(actualResult).toBeFalsy();
            });
        });
    });
});

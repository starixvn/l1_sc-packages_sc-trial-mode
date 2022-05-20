import { PlayerHandler } from "../../handlers/player-handler";
import { Bet } from "../../models/bet";
import { Chance } from "chance";
import { User } from "../../models/game-data";
import { SlotConfig } from "../../models/config";
import noticeHelper from "../../helpers/notice-helper";

const chance = new Chance();

const user: User = {
    balance: chance.natural(),
    emit: jest.fn(),
};
const slotConfig = {
    betMultiplier: 20,
    betLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    coinValues: [0.1, 0.5, 1, 2, 3, 4, 5],
} as SlotConfig;

const logError = jest.fn();
let handler = new PlayerHandler(user.balance, user.emit);

describe("playerHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        handler = new PlayerHandler(user.balance, user.emit);
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

    describe("dequeueBets", () => {
        const getSettleBetResult = jest.fn();
        const slotConfig = {} as SlotConfig;

        describe("when is NOT processing bet", () => {
            beforeEach(() => {
                handler["proceedBet"] = jest.fn().mockResolvedValue("success");
            });

            describe("when bet is processing", () => {
                it("should emit cant place bet to client", async () => {
                    // Arrange
                    handler["isProcessing"] = true;
                    handler.emitMessage = jest.fn();

                    // Act
                    await handler.dequeueBets(getSettleBetResult, slotConfig, logError);

                    // Assert
                    expect(handler.emitMessage).toBeCalledWith({ endBet: -1, errorCode: noticeHelper.cannotPlaceBet });
                });
            });

            describe("when bet is NOT processing", () => {
                beforeEach(() => {
                    handler["isProcessing"] = false;
                });

                it("should call proceedBet", () => {
                    // Arrange
                    const bet: Bet = { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: chance.bool() };
                    handler["betQueue"].shift = jest.fn().mockReturnValueOnce(bet);

                    // Act
                    handler.dequeueBets(getSettleBetResult, slotConfig, logError);

                    // Assert
                    expect(handler["proceedBet"]).toBeCalledWith(bet, getSettleBetResult, slotConfig);
                });

                it("should set isProcessing to true", () => {
                    // Act
                    handler.dequeueBets(getSettleBetResult, slotConfig, logError);

                    // Assert
                    expect(handler["isProcessing"]).toBeTruthy();
                });

                describe("when proceedBet success", () => {
                    it("should set isProcessing to false", async () => {
                        // Arrange
                        handler["proceedBet"] = jest.fn().mockResolvedValue("success");

                        // Act
                        await handler.dequeueBets(getSettleBetResult, slotConfig, logError);

                        // Assert
                        expect(handler["isProcessing"]).toBeFalsy();
                    });
                });
            });
        });
    });

    describe("emitMessage", () => {
        it("should call emit", () => {
            // Arrange
            const message = chance.string();
            jest.spyOn(handler as any, "emit");

            // Act
            handler.emitMessage(message);

            // Assert
            expect(handler["emit"]).toBeCalledWith(message);
        });
    });

    describe("proceedBet", () => {
        const round = {};
        const betwin = chance.natural();
        const bet: Bet = { betLevel: 10, coinValue: 0.5, freeSpin: chance.bool() };
        let getSettlementResult;

        beforeEach(() => {
            handler.emitMessage = jest.fn();
            handler["generateRoundFromBet"] = jest.fn().mockReturnValueOnce(round);
            getSettlementResult = jest.fn().mockImplementation((round) => {
                round.betwin = betwin;
            });
        });

        describe("when bet is valid", () => {
            beforeEach(() => {
                handler["validateBet"] = jest.fn().mockReturnValueOnce(true);
                handler["collectFreeSpins"] = jest.fn();
                handler["collectTotalMultiplier"] = jest.fn();
                handler["collectRoundResult"] = jest.fn();
            });

            describe("when bet is free bet", () => {
                const freeSpinData = {
                    betLevel: chance.natural(),
                    coinValue: chance.natural(),
                    available: 3,
                };

                beforeEach(() => {
                    handler["freeSpins"] = freeSpinData;
                });

                it("should deduct available free spins", async () => {
                    // Act
                    await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                    // Assert
                    expect(freeSpinData.available).toBe(2);
                });

                it("should update bet", async () => {
                    // Act
                    await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                    // Assert
                    expect(bet).toStrictEqual({ betLevel: freeSpinData.betLevel, coinValue: freeSpinData.coinValue, freeSpin: true });
                });

                it("should emit message bet success", async () => {
                    // Arrange
                    const currentBalance = handler["balance"];

                    // Act
                    await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                    // Assert
                    expect(handler["emitMessage"]).toHaveBeenNthCalledWith(1, { endBet: 0, freeSpin: true, user: { balance: currentBalance } });
                });
            });

            describe("when bet is normal bet", () => {
                const bet = { betLevel: chance.natural(), coinValue: chance.natural(), freeSpin: false };

                it("should set total multiplier to zero", async () => {
                    // Arrange
                    handler["totalMultiplier"] = 4;

                    // Act
                    await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                    // Assert
                    expect(handler["totalMultiplier"]).toBe(0);
                });

                it("should deduct player balance", async () => {
                    // Arrange
                    const prevBalance = handler["balance"];
                    const betAmount = bet.betLevel * bet.coinValue * slotConfig.betMultiplier;
                    getSettlementResult = jest.fn().mockResolvedValueOnce({ betwin: 0 });

                    // Act
                    await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                    // Assert
                    expect(handler["balance"]).toBe(prevBalance - betAmount);
                });

                it("should emit success bet", async () => {
                    // Arrange
                    const betAmount = bet.betLevel * bet.coinValue * slotConfig.betMultiplier;

                    // Act
                    await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                    // Assert
                    expect(handler["emitMessage"]).toBeCalledWith({ endBet: betAmount, user: { balance: handler["balance"] } });
                });
            });

            it("should call generateRoundFromBet", async () => {
                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(handler["generateRoundFromBet"]).toBeCalledWith(bet, slotConfig);
            });

            it("should call getSettlementResult", async () => {
                // Arrange
                const mockRound = { ...bet };
                handler["generateRoundFromBet"] = jest.fn().mockReturnValueOnce(mockRound);

                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(getSettlementResult).toBeCalledWith(mockRound, handler["totalMultiplier"]);
            });

            it("should call collect free spins", async () => {
                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(handler["collectFreeSpins"]).toBeCalledWith(round);
            });

            it("should call collect free spins", async () => {
                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(handler["collectTotalMultiplier"]).toBeCalledWith(round);
            });

            it("should add bet win into player balance", async () => {
                // Arrange
                const prevBalance = handler["balance"];
                const betwin = chance.natural();
                const betAmount = bet.betLevel * bet.coinValue * slotConfig.betMultiplier;
                getSettlementResult = jest.fn().mockImplementation((round) => {
                    round.betwin = betwin;
                });

                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(handler["balance"]).toBe(prevBalance - betAmount + betwin);
            });

            it("should call collectRoundResult", async () => {
                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(handler["collectRoundResult"]).toBeCalledWith(round, slotConfig.bigWinRatio);
            });

            it("should emit finish to client", async () => {
                // Arrange
                const roundResult = {
                    roundId: chance.natural(),
                    result: chance.string(),
                };
                handler["collectRoundResult"] = jest.fn().mockReturnValueOnce(roundResult);

                // Act
                await handler["proceedBet"](bet, getSettlementResult, slotConfig);

                // Assert
                expect(handler.emitMessage).toBeCalledWith({ finish: roundResult });
            });
        });
    });

    describe("collectFreeSpins", () => {
        describe("when player gains free spins", () => {
            const round = {
                settlementResult: {
                    freeSpins: {
                        odds: chance.natural(),
                    },
                },
                betLevel: chance.natural(),
                coinValue: chance.natural(),
            };

            it("should set player freeSpins.betLevel", () => {
                // Act
                handler["collectFreeSpins"](round);

                // Assert
                expect(handler["freeSpins"].betLevel).toBe(round.betLevel);
            });

            it("should set player freeSpins.coinValue", () => {
                // Act
                handler["collectFreeSpins"](round);

                // Assert
                expect(handler["freeSpins"].coinValue).toBe(round.coinValue);
            });

            it("should set player freeSpins.available", () => {
                // Act
                handler["collectFreeSpins"](round);

                // Assert
                expect(handler["freeSpins"].available).toBe(round.settlementResult.freeSpins.odds);
            });
        });

        describe("when player gains additional free spins", () => {
            it("should add free spins to available free spins", () => {
                // Arrange
                const availableFreeSpins = handler["freeSpins"].available;
                const additionalFreeSpins = chance.natural();
                const round = {
                    settlementResult: {
                        freeSpins: {},
                        additionalFreeSpins: {
                            odds: additionalFreeSpins,
                        },
                    },
                };

                // Act
                handler["collectFreeSpins"](round);

                // Assert
                expect(handler["freeSpins"].available).toBe(availableFreeSpins + additionalFreeSpins);
            });
        });
    });

    describe("collectTotalMultiplier", () => {
        describe("when round is using free spin", () => {
            it("should add multiplier to player total multiplier", () => {
                // Arrange
                const currentTotalMultiplier = chance.natural();
                const round = {
                    freeSpin: true,
                    multiplier: chance.natural(),
                };
                handler["totalMultiplier"] = currentTotalMultiplier;

                // Act
                handler["collectTotalMultiplier"](round);

                // Assert
                expect(handler["totalMultiplier"]).toBe(currentTotalMultiplier + round.multiplier);
            });
        });
    });

    describe("validateBet", () => {
        beforeEach(() => {
            handler["emitMessage"] = jest.fn();
        });

        describe("when bet is using free spin & player has available free spin", () => {
            it("should return true", () => {
                // Arrange
                const bet: Bet = {
                    betLevel: chance.natural(),
                    coinValue: chance.natural(),
                    freeSpin: true,
                };
                handler["freeSpins"].available = 4;

                // Act
                const actualResult = handler["validateBet"](bet, slotConfig);

                // Assert
                expect(actualResult).toBeTruthy();
            });
        });

        describe("when bet is free spin & player has NO available free spin", () => {
            const bet: Bet = {
                betLevel: chance.natural(),
                coinValue: chance.natural(),
                freeSpin: true,
            };

            beforeEach(() => {
                handler["freeSpins"].available = 0;
            });

            it("should emit invalidFreeSpin to client", () => {
                // Act
                handler["validateBet"](bet, slotConfig);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({ errorCode: noticeHelper.invalidFreeSpin });
            });

            it("should return false", () => {
                // Act
                const actualResult = handler["validateBet"](bet, slotConfig);

                // Assert
                expect(actualResult).toBeFalsy();
            });
        });

        describe("when bet level is invalid", () => {
            const bet: Bet = {
                betLevel: 20,
                coinValue: chance.pickone(slotConfig.coinValues),
            };

            it("should emit invalidBet to client", () => {
                // Act
                handler["validateBet"](bet, slotConfig);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({ errorCode: noticeHelper.invalidBet });
            });
            it("should return false", () => {
                // Act
                const actualResult = handler["validateBet"](bet, slotConfig);

                // Assert
                expect(actualResult).toBeFalsy();
            });
        });

        describe("when coin value is invalid", () => {
            const bet: Bet = {
                betLevel: chance.pickone(slotConfig.betLevels),
                coinValue: 0,
            };

            it("should emit invalidBet to client", () => {
                // Act
                handler["validateBet"](bet, slotConfig);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({ errorCode: noticeHelper.invalidBet });
            });
            it("should return false", () => {
                // Act
                const actualResult = handler["validateBet"](bet, slotConfig);

                // Assert
                expect(actualResult).toBeFalsy();
            });
        });

        describe("when player does NOT have enough balance", () => {
            const bet: Bet = {
                betLevel: chance.pickone(slotConfig.betLevels),
                coinValue: chance.pickone(slotConfig.coinValues),
            };

            beforeEach(() => {
                handler["balance"] = 0.01;
            });

            it("should emit notEnoughMoney to client", () => {
                // Act
                handler["validateBet"](bet, slotConfig);

                // Assert
                expect(handler["emitMessage"]).toBeCalledWith({ errorCode: noticeHelper.notEnoughMoney });
            });

            it("should return false", () => {
                // Act
                const actualResult = handler["validateBet"](bet, slotConfig);

                // Assert
                expect(actualResult).toBeFalsy();
            });
        });

        describe("when bet is valid", () => {
            it("should return true", () => {
                // Arrange
                const bet: Bet = {
                    betLevel: chance.pickone(slotConfig.betLevels),
                    coinValue: chance.pickone(slotConfig.coinValues),
                };
                handler["balance"] = 2000;

                // Act
                const actualResult = handler["validateBet"](bet, slotConfig);

                // Assert
                expect(actualResult).toBeTruthy();
            });
        });
    });
});

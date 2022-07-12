import { FreeSpinHandler } from "../../src/handlers";
import { FreeSpin } from "../../src/models/free-spin";
import { Chance } from "chance";

describe("freeSpinHandler", () => {
    const chance = new Chance();

    const freeSpins: FreeSpin = {
        available: chance.natural(),
        betLevel: chance.natural(),
        coinValue: chance.natural(),
    };
    let freeSpinHandler: FreeSpinHandler;

    beforeEach(() => {
        freeSpinHandler = new FreeSpinHandler();
        freeSpinHandler["freeSpins"] = { ...freeSpins };
    });

    describe("getFreeSpinData", () => {
        it("should return freeSpins", () => {
            // Act
            const actualResult = freeSpinHandler["getFreeSpinData"]();

            // Assert
            expect(actualResult).toStrictEqual(freeSpins);
        });
    });

    describe("useFreeSpin", () => {
        describe("when having available freeSpins", () => {
            it("should decrease available freeSpins by one", () => {
                // Act
                freeSpinHandler["useFreeSpin"]();

                // Assert
                expect(freeSpinHandler["freeSpins"].available).toBe(freeSpins.available - 1);
            });

            describe("when having no freeSpins after using", () => {
                it("should call resetTotalMultiplier", () => {
                    // Arrange
                    freeSpinHandler["freeSpins"].available = 1;
                    freeSpinHandler["resetTotalMultiplier"] = jest.fn();

                    // Act
                    freeSpinHandler["useFreeSpin"]();

                    // Assert
                    expect(freeSpinHandler["resetTotalMultiplier"]).toBeCalled();
                });
            });
        });
    });

    describe("gainFreeSpins", () => {
        const newFreeSpin: FreeSpin = {
            betLevel: chance.natural(),
            coinValue: chance.natural(),
            available: chance.natural(),
        };

        describe("when have available freeSpins", () => {
            it("should increase available freeSpins", () => {
                // Act
                freeSpinHandler["gainFreeSpins"](newFreeSpin);

                // Assert
                expect(freeSpinHandler["freeSpins"]).toStrictEqual({
                    betLevel: freeSpins.betLevel,
                    coinValue: freeSpins.coinValue,
                    available: freeSpins.available + newFreeSpin.available,
                });
            });
        });

        describe("when have no available freSpins", () => {
            it("should assign new freeSpin", () => {
                // Arrange
                freeSpinHandler["freeSpins"].available = 0;

                // Act
                freeSpinHandler["gainFreeSpins"](newFreeSpin);

                // Assert
                expect(freeSpinHandler["freeSpins"]).toStrictEqual(newFreeSpin);
            });
        });
    });

    describe("getAvailableFreeSpins", () => {
        it("should return available freeSpins", () => {
            // Act
            const actualResult = freeSpinHandler["getAvailableFreeSpins"]();

            // Assert
            expect(actualResult).toBe(freeSpins.available);
        });
    });

    describe("increaseTotalMultiplier", () => {
        it("should increase total multiplier", () => {
            // Arrange
            const currentTotalMultiplier = freeSpinHandler["totalMultiplier"];
            const multiplier = chance.natural();

            // Act
            freeSpinHandler["increaseTotalMultiplier"](multiplier);

            // Assert
            expect(freeSpinHandler["totalMultiplier"]).toBe(currentTotalMultiplier + multiplier);
        });
    });

    describe("getCurrentTotalMultiplier", () => {
        it("should return current total multiplier", () => {
            // Act
            const actualResult = freeSpinHandler["getCurrentTotalMultiplier"]();

            // Assert
            expect(actualResult).toBe(freeSpinHandler["totalMultiplier"]);
        });
    });
});

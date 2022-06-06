import { PlayerHandler } from "../../src/handlers/player-handler";
import { Bet } from "../../src/models/bet";
import { Chance } from "chance";
import { User } from "../../src/models/game-data";
import { CascadingSlotsConfig } from "../../src/models/config";
import noticeHelper from "../../src/helpers/notice-helper";
import { TrialConfigs } from "../../src/trial-configs";
import { Round } from "../../src/models/round";

const chance = new Chance();

const user: User = {
    balance: chance.natural(),
    emit: jest.fn(),
};
const cascadingSlotsConfig = {
    betMultiplier: 20,
    betLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    coinValues: [0.1, 0.5, 1, 2, 3, 4, 5],
} as CascadingSlotsConfig;

const logError = jest.fn();
const roundCalculator = { processSpinning: jest.fn() };
let handler = new PlayerHandler(cascadingSlotsConfig, user.emit);

describe("playerHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        handler = new PlayerHandler(cascadingSlotsConfig, user.emit);
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
});

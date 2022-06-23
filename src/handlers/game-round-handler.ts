import { Bet, Round, CascadingSlotsConfig, RoundCalculator } from "../models";
import { TrialConfigs } from "../trial-configs";
import { FreeSpinHandler } from "./";

export class GameRoundHandler {
    private roundId: number;
    private freeSpinHandler: FreeSpinHandler;
    private cascadingSlotsConfig: CascadingSlotsConfig;

    constructor(freeSpinHandler: FreeSpinHandler, cascadingSlotsConfig: CascadingSlotsConfig) {
        this.roundId = 0;
        this.freeSpinHandler = freeSpinHandler;
        this.cascadingSlotsConfig = cascadingSlotsConfig;
    }

    public async settle(bet: Bet, roundCalculator: RoundCalculator) {
        const round = this.generateRoundFromBet(bet);
        const maxWinPerRound = parseFloat((TrialConfigs.maxWinPerRound * round.totalAmount).toFixed(2));

        await roundCalculator.processSpinning(round, this.freeSpinHandler.getCurrentTotalMultiplier(), maxWinPerRound);

        this.roundId++;

        this.collectFreeSpins(round);
        this.collectTotalMultiplier(round);

        return this.collectRoundResult(round);
    }

    private collectFreeSpins(round: Round) {
        const newFreeSpin = {
            betLevel: round.betLevel,
            coinValue: round.coinValue,
            available: round.settlementResult.freeSpins.odds ?? round.settlementResult.additionalFreeSpins?.odds ?? 0,
        };

        newFreeSpin.available && this.freeSpinHandler.gainFreeSpins(newFreeSpin);
    }

    private collectTotalMultiplier(round: Round) {
        round.betwin && this.freeSpinHandler.increaseTotalMultiplier(round.multiplier ?? 0);
    }

    private collectRoundResult(round: Round) {
        return {
            roundId: this.roundId,
            result: round.result,
            win: round.betwin,
            bigWin: round.totalAmount * this.cascadingSlotsConfig.bigWinRatio < round.betwin,
            freeSpins: round.settlementResult.freeSpins.odds,
            totalFreeSpins: this.freeSpinHandler.getAvailableFreeSpins(),
            tumbles: round.settlementResult.tumbles.map((tumble) => ({
                icons: tumble.icons,
                win: tumble.win,
                result: tumble.newBoard,
                multipliers: tumble.multipliers,
                settlement: {
                    explode: tumble.explodedSymbols,
                    new: tumble.newSymbols,
                },
            })),
            multiplier: round.multiplier,
            totalMultiplier: round.totalMultiplier,
            isFreeSpin: round.freeSpin,
            reachMaxWin: round.reachMaxWin,
            actualBetwin: round.actualBetwin,
        };
    }

    private generateRoundFromBet(bet: Bet): Round {
        return {
            freeSpin: bet.freeSpin,
            bet: bet.betLevel * bet.coinValue,
            totalAmount: bet.betLevel * bet.coinValue * this.cascadingSlotsConfig.betMultiplier,
            betMultiplier: this.cascadingSlotsConfig.betMultiplier,
            betLevel: bet.betLevel,
            coinValue: bet.coinValue,
            bigWin: false,
            odds: {
                oddsByCounts: this.cascadingSlotsConfig.oddsByCounts,
                freeSpins: this.cascadingSlotsConfig.freeSpins,
            },
            totalFreeSpins: 0,
            settlementResult: {
                tumbles: [],
                freeSpins: { count: 0, odds: 0 },
                additionalFreeSpins: { count: 0, odds: 0 },
            },
            betwin: 0,
            totalMultiplier: 0,
            totalTumbleWin: 0,
            multiplier: 0,
            result: "",
            actualBetwin: 0,
            reachMaxWin: false,
        };
    }
}

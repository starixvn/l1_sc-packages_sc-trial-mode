import { Bet } from "../models/bet";
import { CascadingSlotsConfig } from "../models/config";
import { FreeSpin } from "../models/free-spin";
import NoticeHelper from "../helpers/notice-helper";
import { TrialConfigs } from "../trial-configs";

export class PlayerHandler {
    private readonly betQueue: Array<Bet>;
    private readonly emit: Function;
    private isProcessing: boolean;
    private balance: number;
    private freeSpins: FreeSpin;
    private totalMultiplier: number;

    constructor(balance: number, emit: Function) {
        this.balance = balance;
        this.emit = emit;
        this.isProcessing = false;
        this.betQueue = [];
        this.freeSpins = { available: 0, coinValue: 0, betLevel: 0 };
        this.totalMultiplier = 0;
    }

    public isHavingBet() {
        return this.betQueue.length > 0;
    }

    public placeBet(bet: Bet) {
        this.betQueue.push(bet);
    }

    public async dequeueBets(roundCalculator: Object, cascadingSlotsConfig: CascadingSlotsConfig, logError: Function) {
        if (!this.isProcessing) {
            this.isProcessing = true;
            const bet = this.betQueue.shift();

            this.proceedBet(bet, roundCalculator, cascadingSlotsConfig)
                .then(() => (this.isProcessing = false))
                .catch((err) => {
                    logError(err);
                });
        } else {
            this.emitMessage({ endBet: -1, errorCode: NoticeHelper.cannotPlaceBet });
        }
    }

    public emitMessage(message: Object) {
        this.emit(message);
    }

    private async proceedBet(bet: Bet, roundCalculator, cascadingSlotsConfig: CascadingSlotsConfig) {
        if (this.validateBet(bet, cascadingSlotsConfig)) {
            bet.freeSpin = this.freeSpins.available > 0;

            if (bet.freeSpin) {
                bet.betLevel = this.freeSpins.betLevel;
                bet.coinValue = this.freeSpins.coinValue;
                this.freeSpins.available--;

                this.emitMessage({ endBet: 0, freeSpin: true, user: { balance: this.balance } });
            } else {
                const betAmount = bet.betLevel * bet.coinValue * cascadingSlotsConfig.betMultiplier;

                this.totalMultiplier = 0;
                this.balance -= betAmount;

                this.emitMessage({ endBet: betAmount, user: { balance: this.balance } });
            }

            const round = this.generateRoundFromBet(bet, cascadingSlotsConfig);
            await roundCalculator.processSpinning(round, this.totalMultiplier);

            this.collectFreeSpins(round);
            this.collectTotalMultiplier(round);

            this.balance = this.balance + round.betwin;
            this.emitMessage({ finish: this.collectRoundResult(round, cascadingSlotsConfig.bigWinRatio) });
        }
    }

    private collectFreeSpins(round) {
        if (round.settlementResult.freeSpins.odds) {
            this.freeSpins.betLevel = round.betLevel;
            this.freeSpins.coinValue = round.coinValue;
            this.freeSpins.available = round.settlementResult.freeSpins.odds;
        } else {
            this.freeSpins.available += round.settlementResult.additionalFreeSpins.odds ?? 0;
        }
    }

    private collectTotalMultiplier(round) {
        if (round.freeSpin) {
            this.totalMultiplier += round.multiplier ?? 0;
        }
    }

    private collectRoundResult(round, bigWinRatio: number) {
        return {
            roundId: round.id,
            result: round.result,
            win: round.betwin,
            bigWin: round.totalAmount * bigWinRatio > round.betwin,
            freeSpins: round.settlementResult.freeSpins.odds,
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
        };
    }

    private generateRoundFromBet(bet: Bet, cascadingSlotsConfig: CascadingSlotsConfig) {
        return {
            freeSpin: bet.freeSpin,
            bet: bet.betLevel * bet.coinValue,
            totalAmount: bet.betLevel * bet.coinValue * cascadingSlotsConfig.betMultiplier,
            betMultiplier: cascadingSlotsConfig.betMultiplier,
            betLevel: bet.betLevel,
            coinValue: bet.coinValue,
            bigWin: false,
            odds: {
                oddsByCount: cascadingSlotsConfig.oddsByCounts,
                freeSpins: cascadingSlotsConfig.freeSpins,
            },
            settlementResult: {
                freeSpins: { count: 0, odds: 0 },
                additionalFreeSpins: { count: 0, odds: 0 },
            },
            betwin: 0,
            totalMultiplier: 0,
            totalTumbleWin: 0,
            multiplier: 0,
            result: "",
        };
    }

    private validateBet(bet: Bet, cascadingSlotsConfig: CascadingSlotsConfig) {
        if (bet.freeSpin && this.freeSpins.available > 0) {
            return true;
        }

        if (bet.freeSpin && this.freeSpins.available <= 0) {
            this.emitMessage({ errorCode: NoticeHelper.invalidFreeSpin });
            return false;
        }

        if (!cascadingSlotsConfig.betLevels.includes(bet.betLevel) || !TrialConfigs.coinValues.includes(bet.coinValue)) {
            this.emitMessage({ errorCode: NoticeHelper.invalidBet });
            return false;
        }

        if (bet.betLevel * bet.coinValue * cascadingSlotsConfig.betMultiplier > this.balance) {
            this.emitMessage({ errorCode: NoticeHelper.notEnoughMoney });
            return false;
        }

        return true;
    }
}

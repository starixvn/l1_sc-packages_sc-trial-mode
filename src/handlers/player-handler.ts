import { CascadingSlotsConfig, Bet, RoundCalculator } from "../models";
import NoticeHelper from "../helpers/notice-helper";
import { TrialConfigs } from "../trial-configs";
import { FreeSpinHandler, GameRoundHandler } from "./";

export class PlayerHandler {
    private readonly betQueue: Array<Bet>;
    private readonly emit: Function;
    private isProcessing: boolean;
    private balance: number;
    private freeSpinHandler: FreeSpinHandler;
    private gameRoundHandler: GameRoundHandler;

    constructor(cascadingSlotsConfig: CascadingSlotsConfig, emit: Function) {
        this.balance = TrialConfigs.defaultBalance;
        this.emit = emit;
        this.isProcessing = false;
        this.betQueue = [];
        this.freeSpinHandler = new FreeSpinHandler();
        this.gameRoundHandler = new GameRoundHandler(this.freeSpinHandler, cascadingSlotsConfig);
    }

    public isHavingBet() {
        return this.betQueue.length > 0;
    }

    public placeBet(bet: Bet) {
        this.betQueue.push(bet);
    }

    public async dequeueBets(roundCalculator: RoundCalculator, cascadingSlotsConfig: CascadingSlotsConfig, logError: Function) {
        const bet = this.getBetFromQueue();

        if (this.validateBet(bet, cascadingSlotsConfig)) {
            const betAmount = bet.betLevel * bet.coinValue * cascadingSlotsConfig.betMultiplier;

            if (bet.freeSpin) {
                this.freeSpinHandler.useFreeSpin();
            } else {
                this.balance -= betAmount;
            }

            this.emitMessage({ endBet: betAmount, freeSpin: bet.freeSpin, user: { balance: this.balance } });

            this.isProcessing = true;

            this.gameRoundHandler
                .settle(bet, roundCalculator)
                .then((settlementResult) => {
                    this.balance = this.balance + settlementResult.win;
                    this.emitMessage({
                        finish: settlementResult,
                        user: { balance: this.balance },
                    });
                })
                .catch((err) => {
                    logError(err);
                })
                .finally(() => {
                    this.isProcessing = false;
                });
        }
    }

    public emitMessage(message: Object) {
        this.emit(message);
    }

    private getBetFromQueue() {
        const bet = this.betQueue.shift();

        bet.freeSpin = this.freeSpinHandler.getAvailableFreeSpins() > 0;

        if (bet.freeSpin) {
            const { betLevel, coinValue } = this.freeSpinHandler.getFreeSpinData();

            bet.betLevel = betLevel;
            bet.coinValue = coinValue;
        } else {
            this.freeSpinHandler.resetTotalMultiplier();
        }

        return bet;
    }

    private composeValidationCriteria(bet: Bet, cascadingSlotsConfig: CascadingSlotsConfig) {
        const availableFreeSpins = this.freeSpinHandler.getAvailableFreeSpins();

        return [
            {
                failure: this.isProcessing,
                errorCode: NoticeHelper.cannotPlaceBet,
            },
            {
                failure: bet.freeSpin && availableFreeSpins <= 0,
                errorCode: NoticeHelper.invalidFreeSpin,
            },
            {
                failure: !cascadingSlotsConfig.betLevels.includes(bet.betLevel) || !TrialConfigs.coinValues.includes(bet.coinValue),
                errorCode: NoticeHelper.invalidBet,
            },
            {
                failure: bet.betLevel * bet.coinValue * cascadingSlotsConfig.betMultiplier > this.balance,
                errorCode: NoticeHelper.notEnoughMoney,
            },
        ];
    }

    private validateBet(bet: Bet, cascadingSlotsConfig: CascadingSlotsConfig) {
        const availableFreeSpins = this.freeSpinHandler.getAvailableFreeSpins();

        const isValidFreeSpin = bet.freeSpin && availableFreeSpins;

        if (isValidFreeSpin) {
            return true;
        }

        const criteria = this.composeValidationCriteria(bet, cascadingSlotsConfig);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.emitMessage({ endBet: -1, errorCode: failedCriterion.errorCode });

            return false;
        }

        return true;
    }
}

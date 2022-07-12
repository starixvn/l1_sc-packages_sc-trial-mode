import { CascadingSlotsConfig, Bet, RoundCalculator, Config } from "../models";
import NoticeHelper from "../helpers/notice-helper";
import { TrialConfigs } from "../trial-configs";
import { FreeSpinHandler, GameRoundHandler } from "./";

export class PlayerHandler {
    private readonly betQueue: Array<Bet>;
    private readonly emit: Function;
    private readonly freeSpinHandler: FreeSpinHandler;
    private readonly gameRoundHandler: GameRoundHandler;
    private readonly cascadingSlotsConfig: CascadingSlotsConfig;
    private isProcessing: boolean;
    private balance: number;

    constructor(config: Config, emit: Function) {
        this.balance = config.defaultBalance ?? TrialConfigs.defaultBalance;
        this.emit = emit;
        this.isProcessing = false;
        this.betQueue = [];
        this.cascadingSlotsConfig = config.cascadingSlotsConfig;

        this.freeSpinHandler = new FreeSpinHandler();
        this.gameRoundHandler = new GameRoundHandler(this.freeSpinHandler, config.cascadingSlotsConfig);
    }

    public isHavingBet() {
        return this.betQueue.length > 0;
    }

    public placeBet(bet: Bet) {
        this.betQueue.push(bet);
    }

    public async dequeueBets(roundCalculator: RoundCalculator, logError: Function) {
        const bet = this.getBetFromQueue();

        if (this.validateBet(bet)) {
            const betAmount = bet.betLevel * bet.coinValue * this.cascadingSlotsConfig.betMultiplier;

            if (bet.freeSpin) {
                this.freeSpinHandler.useFreeSpin();
            } else {
                this.balance -= betAmount;
            }

            this.emitMessage({ endBet: betAmount, freeSpin: bet.freeSpin, trialUser: { balance: this.balance } });

            this.isProcessing = true;

            try {
                const settleResult = await this.gameRoundHandler.settle(bet, roundCalculator);

                this.balance = this.balance + settleResult.win;
                this.emitMessage({
                    finish: settleResult,
                    trialUser: { balance: this.balance },
                });
            } catch (err) {
                logError(err);
            }

            this.isProcessing = false;
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

    private composeValidationCriteria(bet: Bet) {
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
                failure: !this.cascadingSlotsConfig.betLevels.includes(bet.betLevel) || !TrialConfigs.coinValues.includes(bet.coinValue),
                errorCode: NoticeHelper.invalidBet,
            },
            {
                failure: !bet.freeSpin && bet.betLevel * bet.coinValue * this.cascadingSlotsConfig.betMultiplier > this.balance,
                errorCode: NoticeHelper.notEnoughMoney,
            },
        ];
    }

    private validateBet(bet: Bet) {
        const availableFreeSpins = this.freeSpinHandler.getAvailableFreeSpins();

        const isValidFreeSpin = bet.freeSpin && availableFreeSpins;

        if (isValidFreeSpin) {
            return true;
        }

        const criteria = this.composeValidationCriteria(bet);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.emitMessage({ endBet: -1, errorCode: failedCriterion.errorCode });

            return false;
        }

        return true;
    }
}

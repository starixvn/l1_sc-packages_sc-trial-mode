import { CascadingSlotsConfig, GameData, RoundCalculator } from "../models";

export class ProcessQueueJob {
    private readonly gameData: GameData;
    private readonly roundCalculator: RoundCalculator;
    private readonly cascadingSlotsConfig: CascadingSlotsConfig;
    private readonly processInterval = 50;
    private readonly logError: Function;

    constructor(gameData: GameData, roundCalculator: RoundCalculator, cascadingSlotsConfig: CascadingSlotsConfig, logError: Function) {
        this.gameData = gameData;
        this.roundCalculator = roundCalculator;
        this.cascadingSlotsConfig = cascadingSlotsConfig;
        this.logError = logError;
    }

    public run() {
        const keepDequeue = () => {
            Object.values(this.gameData).forEach((user) => {
                user && user.isHavingBet() && user.dequeueBets(this.roundCalculator, this.cascadingSlotsConfig, this.logError);
            });

            setTimeout(() => keepDequeue(), this.processInterval);
        };

        setTimeout(() => keepDequeue(), this.processInterval);
    }
}

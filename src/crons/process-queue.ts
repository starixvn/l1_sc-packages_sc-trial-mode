import { GameData, RoundCalculator } from "../models";

export class ProcessQueueJob {
    private readonly gameData: GameData;
    private readonly roundCalculator: RoundCalculator;
    private readonly processInterval = 50;
    private readonly logError: Function;

    constructor(gameData: GameData, roundCalculator: RoundCalculator, logError: Function) {
        this.gameData = gameData;
        this.roundCalculator = roundCalculator;
        this.logError = logError;
    }

    public run() {
        const keepDequeue = () => {
            Object.values(this.gameData).forEach((user) => {
                user && user.isHavingBet() && user.dequeueBets(this.roundCalculator, this.logError);
            });

            setTimeout(() => keepDequeue(), this.processInterval);
        };

        setTimeout(() => keepDequeue(), this.processInterval);
    }
}

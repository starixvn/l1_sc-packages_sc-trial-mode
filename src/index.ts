import { handleInGame, handleDisconnect, handlePlaceBet } from "./handlers";
import { Config } from "./models/config";
import { Socket } from "socket.io";
import { GameData } from "./models/game-data";
import { ProcessQueueJob } from "./handlers/process-queue-handler";

export class TrialMode {
    private config: Config;
    private readonly gameData: GameData;
    private readonly roundCalculator: Object;
    private readonly logError: Function;

    constructor(roundCalculator: Object, logError: Function) {
        this.roundCalculator = roundCalculator;
        this.logError = logError;
        this.gameData = {};
    }

    public init(configs: Config) {
        this.config = configs;

        const processQueueJob = new ProcessQueueJob(this.gameData, this.roundCalculator, configs.cascadingSlotsConfig, this.logError);

        processQueueJob.run();
    }

    public registerSocketHandler(socketClient: Socket) {
        socketClient.on("inGame", () => handleInGame(socketClient, this.gameData, this.config));
        socketClient.on("disconnect", () => handleDisconnect(socketClient, this.gameData));
        socketClient.on("bet", (payload) => handlePlaceBet(socketClient, payload, this.gameData));
    }
}

import { handleInGame, handleDisconnect, handlePlaceBet } from './handlers';
import { Config } from './models/config';
import { Socket } from 'socket.io';
import { GameData } from './models/game-data';
import { ProcessQueueJob } from './handlers/process-queue-handler';

export class TrialMode {
  private config: Config;
  private gameData: GameData;

  constructor(config: Config, getSettleBetResult: Function) {
    this.config = config;
    this.gameData = {};

    const processQueueJob = new ProcessQueueJob(this.gameData, getSettleBetResult, config.slotConfig);

    processQueueJob.run();
  }

  public registerSocketHandler(socketClient: Socket) {
    socketClient.on('inGame', () => handleInGame(socketClient, this.gameData, this.config));
    socketClient.on('disconnect', () => handleDisconnect(socketClient, this.gameData));
    socketClient.on('bet', payload => handlePlaceBet(payload));
  }
}

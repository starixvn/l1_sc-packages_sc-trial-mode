import { handleInGame, handleDisconnect, handlePlaceBet } from './handlers';
import { Config } from './models/config';
import { Socket } from 'socket.io';
import { UserBalance } from './models/user-balance';

export class TrialMode {
  private config: Config;
  private userBalance: UserBalance;

  constructor(config: Config, getSettleBetResult: Function) {
    this.config = config;
  }

  public registerSocketHandler(socketClient: Socket) {
    socketClient.on('inGame', () => handleInGame(socketClient, this.userBalance, this.config));
    socketClient.on('disconnect', () => handleDisconnect(socketClient, this.userBalance));
    // socketClient.on('bet', payload =>
    //   handlePlaceBet({ socketClient, payload, betQueue: this.betQueue, config: this.config, userBalance: this.userBalance }),
    // );
  }
}

import { queue } from 'fastq';
import { Socket } from 'socket.io';
import { Bet } from './bet';
import { Config } from './config';
import { UserBalance } from './user-balance';

export interface PlaceBetParams {
  socketClient: Socket;
  payload: Bet;
  betQueue: queue;
  userBalance: UserBalance;
  config: Config;
}

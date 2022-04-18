import { worker } from 'fastq';
import { Bet } from '../models/bet';
import { BetQueueContext } from '../models/bet-queue-context';

export function processBet: worker<BetQueueContext, Bet, Function> (bet: Bet, cb: Function) {
  cb(bet);
};

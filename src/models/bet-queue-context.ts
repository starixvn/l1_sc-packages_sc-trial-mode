import { UserBalance } from './user-balance';

export interface BetQueueContext {
  getSettleBetResult: Function;
  userBalance: UserBalance;
}

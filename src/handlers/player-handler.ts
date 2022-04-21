import { Bet } from '../models/bet';
import { SlotConfig } from '../models/config';

export class PlayerHandler {
  private betQueue: Array<Bet>;
  private isProcessing: boolean;
  private balance: number;
  private emit: Function;

  constructor(balance: number, emit: Function) {
    this.balance = balance;
    this.emit = emit;
    this.isProcessing = false;
    this.betQueue = [];
  }

  public placeBet(bet: Bet) {
    this.betQueue.push(bet);
  }

  public async dequeueBets(getSettlementResult: Function, slotConfig: SlotConfig) {
    if (!this.isProcessing) {
      this.isProcessing = true;
      const bet = this.betQueue.shift();

      this.proceedBet(bet, getSettlementResult, slotConfig)
        .then(() => (this.isProcessing = false))
        .catch(err => {
          console.log(err);
        });
    }
  }

  public emitMessage(message: Object) {
    this.emit('trial-mode', message);
  }

  private async proceedBet(bet: Bet, getSettlementResult: Function, slotConfig: SlotConfig) {
    if (bet && this.validateBet(bet, slotConfig)) {
      const betAmount = bet.betLevel * bet.coinValue;
      this.emitMessage({ endBet: betAmount, user: { balance: this.balance - betAmount } });

      const result = await getSettlementResult(bet, slotConfig);

      this.balance = this.balance + result.netWin - betAmount;
      this.emitMessage({ finish: result });
    }
  }

  private validateBet(bet: Bet, slotConfig: SlotConfig) {
    if (!slotConfig.betLevels.includes(bet.betLevel) || !slotConfig.coinValues.includes(bet.coinValue)) {
      this.emitMessage({ errorCode: 'SB1935' });
      return false;
    }

    if (bet.betLevel * bet.coinValue > this.balance) {
      this.emitMessage({ errorCode: 'SB1907' });
      return false;
    }

    return true;
  }
}

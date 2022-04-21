import { SlotConfig } from '../models/config';
import { GameData } from '../models/game-data';

export class ProcessQueueJob {
  private gameData: GameData;
  private getSettlementResult: Function;
  private slotConfig: SlotConfig;
  private processInterval = 50;

  constructor(gameData: GameData, getSettlementResult: Function, slotConfig: SlotConfig) {
    this.gameData = gameData;
    this.getSettlementResult = getSettlementResult;
    this.slotConfig = slotConfig;
  }

  public run() {
    const keepDequeue = () => {
      Object.values(this.gameData).forEach(user => {
        user && user.dequeueBets(this.getSettlementResult, this.slotConfig);
      });

      setTimeout(() => keepDequeue(), this.processInterval);
    };

    setTimeout(() => keepDequeue(), this.processInterval);
  }
}

import { PlayerHandler } from '../../handlers/player-handler';
import { Bet } from '../../models/bet';
import { Chance } from 'chance';
import { User } from '../../models/game-data';
import { SlotConfig } from '../../models/config';

const chance = new Chance();

const user: User = {
  balance: chance.natural(),
  emit: jest.fn(),
};

let handler = new PlayerHandler(user.balance, user.emit);

describe('playerHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    handler = new PlayerHandler(user.balance, user.emit);
  });

  describe('placeBet', () => {
    it('should call betQueue.push', () => {
      // Arrange
      const bet: Bet = { betLevel: chance.natural(), coinValue: chance.natural() };
      handler['betQueue'].push = jest.fn();

      // Act
      handler.placeBet(bet);

      // Assert
      expect(handler['betQueue'].push).toBeCalledWith(bet);
    });
  });

  describe('dequeueBets', () => {
    const getSettleBetResult = jest.fn();
    const slotConfig = {} as SlotConfig;

    describe('when is NOT processing bet', () => {
      beforeEach(() => {
        handler['isProcessing'] = false;
        handler['proceedBet'] = jest.fn().mockResolvedValue('success');
      });

      it('should call proceedBet', () => {
        // Arrange
        const bet: Bet = { betLevel: chance.natural(), coinValue: chance.natural() };
        handler['betQueue'].shift = jest.fn().mockReturnValueOnce(bet);

        // Act
        handler.dequeueBets(getSettleBetResult, slotConfig);

        // Assert
        expect(handler['proceedBet']).toBeCalledWith(bet, getSettleBetResult, slotConfig);
      });

      it('should set isProcessing to true', () => {
        // Act
        handler.dequeueBets(getSettleBetResult, slotConfig);

        // Assert
        expect(handler['isProcessing']).toBeTruthy();
      });

      describe('when proceedBet success', () => {
        it('should set isProcessing to false', async () => {
          // Arrange
          handler['proceedBet'] = jest.fn().mockResolvedValue('success');

          // Act
          await handler.dequeueBets(getSettleBetResult, slotConfig);

          // Assert
          expect(handler['isProcessing']).toBeFalsy();
        });
      });
    });
  });

  describe('emitMessage', () => {
    it('should call emit', () => {
      // Arrange
      const message = chance.string();
      handler['emit'] = jest.fn();

      // Act
      handler.emitMessage(message);

      // Assert
      expect(handler['emit']).toBeCalledWith('trial-mode', message);
    });
  });

  describe('proceedBet', () => {
    const settleBetResult = { netWin: 200 };
    const slotConfig = {} as SlotConfig;
    const bet: Bet = { betLevel: 10, coinValue: 0.5 };
    let getSettlementResult;

    beforeEach(() => {
      handler.emitMessage = jest.fn();
      getSettlementResult = jest.fn().mockResolvedValueOnce(settleBetResult);
    });

    describe('when bet is valid', () => {
      beforeEach(() => {
        handler['validateBet'] = jest.fn().mockReturnValueOnce(true);
      });

      it('should emit endBet success', async () => {
        // Arrange
        const balance = handler['balance'];
        const betAmount = bet.betLevel * bet.coinValue;

        // Act
        await handler['proceedBet'](bet, getSettlementResult, slotConfig);

        // Assert
        expect(handler.emitMessage).toHaveBeenNthCalledWith(1, { endBet: betAmount, user: { balance: balance - betAmount } });
      });

      it('should call getSettlementResult', async () => {
        // Act
        await handler['proceedBet'](bet, getSettlementResult, slotConfig);

        // Assert
        expect(getSettlementResult).toBeCalledWith(bet, slotConfig);
      });

      it('should emit finish result', async () => {
        // Act
        await handler['proceedBet'](bet, getSettlementResult, slotConfig);

        // Assert
        expect(handler.emitMessage).toHaveBeenNthCalledWith(2, { finish: settleBetResult });
      });

      it('should update user balance', async () => {
        // Arrange
        const balance = handler['balance'];
        const betAmount = bet.betLevel * bet.coinValue;

        // Act
        await handler['proceedBet'](bet, getSettlementResult, slotConfig);

        // Assert
        expect(handler['balance']).toBe(balance - betAmount + settleBetResult.netWin);
      });
    });
  });
});

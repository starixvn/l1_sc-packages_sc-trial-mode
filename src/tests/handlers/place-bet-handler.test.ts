import { handlePlaceBet } from '../../handlers';
import { PlayerHandler } from '../../handlers/player-handler';

jest.mock('../../handlers/player-handler');

describe('placeBetHandler', () => {
  const player = new PlayerHandler(2000, jest.fn());

  describe('when params is NOT valid', () => {
    it('should not call placeBet', () => {
      // Act
      handlePlaceBet({ payload: { betLevel: 1, coinValue: 1 }, player: undefined });

      // Assert
      expect(player.placeBet).not.toBeCalled();
    });

    it('should emit error to client', () => {
      // Act
      handlePlaceBet({ payload: undefined, player });

      // Assert
      expect(player.emitMessage).toBeCalledWith({ errorCode: 'SB1935' });
    });
  });

  describe('when params is valid', () => {
    it('should not call placeBet', () => {
      // Arrange
      const payload = { betLevel: 1, coinValue: 1 };

      // Act
      handlePlaceBet({ payload, player });

      // Assert
      expect(player.placeBet).toBeCalledWith(payload);
    });
  });
});

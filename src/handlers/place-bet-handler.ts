import { PlaceBetParams } from '../models/place-bet-params';

export const handlePlaceBet = (params: PlaceBetParams) => {
  const { payload, player } = params;

  if (payload && player) {
    player.placeBet(payload);
  } else {
    player?.emitMessage({ errorCode: 'SB1935' });
  }
};

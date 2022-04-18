import { PlaceBetParams } from '../models/place-bet-params';

const validateBet = (amount, config) => {
  return true;
};

export const handlePlaceBet = (params: PlaceBetParams) => {
  const { socketClient, payload, betQueue, userBalance, config } = params;

  if (validateBet(payload, config)) {
    socketClient.emit('endBet', false);

    return;
  } else {
  }
};

import { Socket } from 'socket.io';
import { Config } from '../models/config';
import { UserBalance } from '../models/user-balance';

export const handleInGame = (socketClient: Socket, userBalance: UserBalance, config: Config) => {
  userBalance[socketClient.id] = config.defaultBalance;

  socketClient.emit('config', config);
};

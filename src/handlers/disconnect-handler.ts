import { Socket } from 'socket.io';
import { UserBalance } from '../models/user-balance';

export const handleDisconnect = (socketClient: Socket, userBalance: UserBalance) => {
  delete userBalance[socketClient.id];

  socketClient.emit('disconnect', true);
};

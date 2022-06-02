import { Socket } from "socket.io";
import NoticeHelper from "../helpers/notice-helper";
import { GameData, Bet } from "../models";

export const handlePlaceBet = (socketClient: Socket, payload: Bet, gameData: GameData) => {
    const player = gameData[socketClient.id];

    if (payload && player) {
        player.placeBet(payload);
    } else {
        player?.emitMessage({ endBet: -1, errorCode: NoticeHelper.invalidBet });
    }
};

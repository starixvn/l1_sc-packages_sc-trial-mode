import { Socket } from "socket.io";
import NoticeHelper from "../helpers/notice-helper";
import { Bet } from "../models/bet";
import { GameData } from "../models/game-data";

export const handlePlaceBet = (socketClient: Socket, payload: Bet, gameData: GameData) => {
    const player = gameData[socketClient.id];

    if (payload && player) {
        player.placeBet(payload);
    } else {
        player?.emitMessage({ errorCode: NoticeHelper.invalidBet });
    }
};

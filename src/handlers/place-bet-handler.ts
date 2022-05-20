import { PlaceBetParams } from "../models/place-bet-params";
import NoticeHelper from "../helpers/notice-helper";

export const handlePlaceBet = (params: PlaceBetParams) => {
    const { payload, player } = params;

    if (payload && player) {
        player.placeBet(payload);
    } else {
        player?.emitMessage({ errorCode: NoticeHelper.invalidBet });
    }
};

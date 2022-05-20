import { PlayerHandler } from "../handlers/player-handler";
import { Bet } from "./bet";

export interface PlaceBetParams {
    payload: Bet;
    player: PlayerHandler;
}

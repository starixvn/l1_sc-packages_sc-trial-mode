import { PlayerHandler } from "../handlers/player-handler";

export interface User {
    balance: number;
    emit: Function;
}

export interface GameData {
    [socketId: string]: PlayerHandler;
}

import { IconOddConfig } from "./config";

interface Tumble {
    newBoard: number[];
    explodedSymbols?: number[];
    newSymbols?: number[];
    multipliers: number[];
    icons: Object;
    win: number;
}

export interface Round {
    freeSpin: boolean;
    bet: number;
    totalAmount: number;
    betMultiplier: number;
    betLevel: number;
    coinValue: number;
    bigWin: boolean;
    totalFreeSpins: number;
    odds: {
        oddsByCounts: { [key: number]: IconOddConfig };
        freeSpins: Object;
    };
    settlementResult: {
        tumbles: Array<Tumble>;
        freeSpins: { count: number; odds: number };
        additionalFreeSpins: { count: number; odds: number };
    };
    betwin: number;
    totalMultiplier: number;
    totalTumbleWin: number;
    multiplier: number;
    result: string;
    actualBetwin: number;
    reachMaxWin: boolean;
}

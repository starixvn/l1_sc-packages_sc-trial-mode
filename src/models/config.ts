interface IconOddConfig {
    isRange: boolean;
    from: number;
    to: number;
    odds: number;
}

interface SlotConfig {
    betLevels: Array<number>;
    coinValues: Array<number>;
    betMultiplier: number;
    bigWinRatio: number;
    oddsByCounts: { [key: number]: IconOddConfig };
    freeSpins: Object;
}

interface Config {
    name: string;
    defaultBalance: number;
    slotConfig: SlotConfig;
}

export { IconOddConfig, SlotConfig, Config };

interface IconOddConfig {
    isRange: boolean;
    from: number;
    to: number;
    odds: number;
}

interface CascadingSlotsConfig {
    maxWinPerRound: number;
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
    cascadingSlotsConfig: CascadingSlotsConfig;
}

export { IconOddConfig, CascadingSlotsConfig, Config };

interface IconOddConfig {
  isRange: boolean;
  from: number;
  to: number;
  odds: number;
}

interface SlotConfig {
  betLevels: Array<number>;
  coinValues: Array<number>;
  multiplier: number;
  oddsByCounts: { [key: number]: IconOddConfig };
}

interface Config {
  name: string;
  defaultBalance: number;
  slotConfig: SlotConfig;
}

export { IconOddConfig, SlotConfig, Config };

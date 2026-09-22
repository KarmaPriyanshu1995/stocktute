export const TIMEFRAMES = ["1m", "5m", "15m", "1D"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

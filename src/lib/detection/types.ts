/** Closed OHLCV bar. Volume may be 0 when the feed does not supply it. */
export type Ohlcv = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PatternBias = "bullish" | "bearish" | "neutral";
export type ExpectedMove = "up" | "down" | "sideways";
export type Trend = "up" | "down" | "sideways";
export type Confirmation = "confirmed" | "unconfirmed" | "unavailable";

export type PatternContext = {
  priorTrend20: Trend | null;
  volumeVsAvg20: number | null;
  ema20: number | null;
  ema50: number | null;
  closeVsEma20: "above" | "below" | "at" | null;
  closeVsEma50: "above" | "below" | "at" | null;
  rsi14: number | null;
  atr14: number | null;
  nearestSupport: number | null;
  nearestResistance: number | null;
  distanceToSupportPct: number | null;
  distanceToResistancePct: number | null;
};

export type ForwardOutcome = {
  bars: 1 | 3 | 5 | 10;
  /** Percent change from the pattern close to the close N bars later. Null if those bars are not closed yet. */
  closeReturnPct: number | null;
  /** Whether the sign of the move matched expectedMove. Null if return is missing. */
  hitExpected: boolean | null;
};

export type BaseRate = {
  universe: string;
  horizonBars: 5;
  sampleSize: number;
  /** Fraction of samples whose 5-bar close moved in the expected direction. Null when sampleSize is 0. */
  hitRate: number | null;
};

export type DetectedSetup = {
  id: string;
  name: string;
  bias: PatternBias;
  expectedMove: ExpectedMove;
  startIndex: number;
  endIndex: number;
  keyLevels: {
    open: number;
    high: number;
    low: number;
    close: number;
    invalidation: number;
  };
  confirmation: Confirmation;
  context: PatternContext;
  forward: ForwardOutcome[];
  baseRate: BaseRate;
};

export type ChartFacts = {
  symbol: string;
  timeframe: string;
  barCount: number;
  lastClose: number;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
  atr14: number | null;
  volumeAvg20: number | null;
  supportLevels: number[];
  resistanceLevels: number[];
  setups: DetectedSetup[];
  /** Human-readable gaps the LLM must not invent around, e.g. missing base rates. */
  missingFacts: string[];
  /** Fixture or generated tape — never shown as live market history. */
  isSynthetic: boolean;
};

export type AnalyzeChartInput = {
  candles: Ohlcv[];
  symbol?: string;
  timeframe?: string;
  isSynthetic?: boolean;
  /** Optional precomputed table keyed by pattern name. Omitted names get sampleSize 0. */
  baseRates?: Partial<Record<string, BaseRate>>;
};

export const FORWARD_HORIZONS = [1, 3, 5, 10] as const;
export const SIDEWAYS_BAND_PCT = 0.5;

export const CLASSROOM_DISCLAIMER =
  "Educational content only. Not investment advice. Past patterns do not guarantee future results.";

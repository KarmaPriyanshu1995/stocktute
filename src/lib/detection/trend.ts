import type { Ohlcv, Trend } from "./types";
import { pctChange } from "./geometry";

const TREND_BAND_PCT = 2;

/**
 * Net 20-bar close change. Moves inside ±2% count as sideways so chop is not
 * labelled as a trend.
 */
export function priorTrend(candles: Ohlcv[], endIndex: number, lookback = 20): Trend | null {
  const start = endIndex - lookback;
  if (start < 0) return null;
  const change = pctChange(candles[start].close, candles[endIndex].close);
  if (change > TREND_BAND_PCT) return "up";
  if (change < -TREND_BAND_PCT) return "down";
  return "sideways";
}

import type {
  AnalyzeChartInput,
  ChartFacts,
  Confirmation,
  DetectedSetup,
  ExpectedMove,
  PatternContext,
} from "./types";
import type { Ohlcv } from "./types";
import { ATR_PERIOD } from "@/config/education";
import { ema, lastDefined, rsi, sma, atr } from "./indicators";
import { priorTrend } from "./trend";
import { distancePct, findSupportResistance, nearest } from "./levels";
import { detectRawPatterns } from "./patterns";
import { expectedMoveFromBias, forwardOutcomes } from "./outcomes";
import { lookupBaseRate } from "./baseRates";
import { round } from "./geometry";

function vsEma(price: number, value: number | null): PatternContext["closeVsEma20"] {
  if (value == null) return null;
  if (Math.abs(price - value) / value <= 0.0005) return "at";
  return price > value ? "above" : "below";
}

function confirmationOf(
  candles: Ohlcv[],
  endIndex: number,
  expectedMove: ExpectedMove,
  high: number,
  low: number,
): Confirmation {
  const next = endIndex + 1;
  if (next >= candles.length) return "unavailable";
  const close = candles[next].close;
  if (expectedMove === "up") return close > high ? "confirmed" : "unconfirmed";
  if (expectedMove === "down") return close < low ? "confirmed" : "unconfirmed";
  return close <= high && close >= low ? "confirmed" : "unconfirmed";
}

/**
 * Deterministic chart analysis. The LLM must only explain this object;
 * it must not detect patterns or invent missing numbers.
 */
export function analyzeChart(input: AnalyzeChartInput): ChartFacts {
  const { candles, symbol = "UNKNOWN", timeframe = "1D", baseRates } = input;
  const isSynthetic = input.isSynthetic ?? true;
  const missingFacts: string[] = [];

  if (candles.length === 0) {
    return {
      symbol,
      timeframe,
      barCount: 0,
      lastClose: 0,
      ema20: null,
      ema50: null,
      rsi14: null,
      atr14: null,
      volumeAvg20: null,
      supportLevels: [],
      resistanceLevels: [],
      setups: [],
      missingFacts: ["No candles provided."],
      isSynthetic,
    };
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const rsiSeries = rsi(closes, 14);
  const atrSeries = atr(candles, ATR_PERIOD);
  const volAvgSeries = sma(volumes, 20);

  const last = candles.length - 1;
  const ema20 = lastDefined(ema20Series);
  const ema50 = lastDefined(ema50Series);
  const rsi14 = lastDefined(rsiSeries);
  const atr14 = lastDefined(atrSeries);
  const volumeAvg20 = lastDefined(volAvgSeries);

  if (ema20 == null) missingFacts.push("EMA(20) needs 20 closed bars.");
  if (ema50 == null) missingFacts.push("EMA(50) needs 50 closed bars.");
  if (rsi14 == null) missingFacts.push("RSI(14) needs 15 closed bars.");
  if (atr14 == null) missingFacts.push("ATR(14) needs 15 closed bars.");
  if (volumeAvg20 == null) missingFacts.push("Volume average needs 20 closed bars.");
  if (!baseRates || Object.keys(baseRates).length === 0) {
    missingFacts.push("Historical base rates were not supplied for this run.");
  }

  const chartLevels = findSupportResistance(candles, last);
  const hits = detectRawPatterns(candles);

  const setups: DetectedSetup[] = hits.map((hit) => {
    const end = candles[hit.endIndex];
    const sliceHigh = Math.max(...candles.slice(hit.startIndex, hit.endIndex + 1).map((c) => c.high));
    const sliceLow = Math.min(...candles.slice(hit.startIndex, hit.endIndex + 1).map((c) => c.low));
    const expectedMove = expectedMoveFromBias(hit.bias);
    const levels = findSupportResistance(candles, hit.endIndex);
    const support = nearest(levels.support);
    const resistance = nearest(levels.resistance);
    const ema20At = ema20Series[hit.endIndex] ?? null;
    const ema50At = ema50Series[hit.endIndex] ?? null;
    const rsiAt = rsiSeries[hit.endIndex] ?? null;
    const atrAt = atrSeries[hit.endIndex] ?? null;
    const volAvgAt = volAvgSeries[hit.endIndex] ?? null;
    const volumeVsAvg20 =
      volAvgAt && volAvgAt > 0 ? round(end.volume / volAvgAt, 4) : null;

    const context: PatternContext = {
      priorTrend20: priorTrend(candles, hit.endIndex),
      volumeVsAvg20,
      ema20: ema20At,
      ema50: ema50At,
      closeVsEma20: vsEma(end.close, ema20At),
      closeVsEma50: vsEma(end.close, ema50At),
      rsi14: rsiAt,
      atr14: atrAt,
      nearestSupport: support,
      nearestResistance: resistance,
      distanceToSupportPct: distancePct(end.close, support),
      distanceToResistancePct: distancePct(end.close, resistance),
    };

    return {
      id: `${hit.name}:${end.time}`,
      name: hit.name,
      bias: hit.bias,
      expectedMove,
      startIndex: hit.startIndex,
      endIndex: hit.endIndex,
      keyLevels: {
        open: candles[hit.startIndex].open,
        high: sliceHigh,
        low: sliceLow,
        close: end.close,
        invalidation: hit.invalidation,
      },
      confirmation: confirmationOf(candles, hit.endIndex, expectedMove, sliceHigh, sliceLow),
      context,
      forward: forwardOutcomes(candles, hit.endIndex, end.close, expectedMove),
      baseRate: lookupBaseRate(baseRates, hit.name),
    };
  });

  return {
    symbol,
    timeframe,
    barCount: candles.length,
    lastClose: candles[last].close,
    ema20,
    ema50,
    rsi14,
    atr14,
    volumeAvg20,
    supportLevels: chartLevels.support,
    resistanceLevels: chartLevels.resistance,
    setups,
    missingFacts,
    isSynthetic,
  };
}

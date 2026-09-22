import type { Ohlcv, PatternBias } from "./types";
import { geom, isDoji, midpoint } from "./geometry";

export type RawHit = {
  name: string;
  bias: PatternBias;
  startIndex: number;
  endIndex: number;
  invalidation: number;
};

const RANK: Record<string, number> = {
  "Morning Star": 10,
  "Evening Star": 10,
  "Three White Soldiers": 9,
  "Three Black Crows": 9,
  "Bullish Engulfing": 8,
  "Bearish Engulfing": 8,
  "Piercing Line": 7,
  "Dark Cloud Cover": 7,
  Hammer: 6,
  "Hanging Man": 6,
  "Shooting Star": 6,
  "Inverted Hammer": 5,
  Doji: 2,
};

/** Textbook candlestick scanners. Indexes are inclusive. One label per end bar. */
export function detectRawPatterns(candles: Ohlcv[]): RawHit[] {
  const found: RawHit[] = [];
  if (candles.length < 1) return found;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const g = geom(c);
    const prev = i > 0 ? candles[i - 1] : null;
    const pg = prev ? geom(prev) : null;
    const prev2 = i > 1 ? candles[i - 2] : null;
    const p2g = prev2 ? geom(prev2) : null;

    if (isDoji(g) && g.range > 0) {
      found.push({
        name: "Doji",
        bias: "neutral",
        startIndex: i,
        endIndex: i,
        invalidation: c.low,
      });
    }

    const hammerShape =
      g.lower >= g.body * 2 &&
      g.lower >= g.range * 0.5 &&
      g.upper <= g.lower * 0.4 &&
      Math.max(c.open, c.close) >= c.low + g.range * 0.55;

    if (hammerShape && prev && pg?.bearish) {
      found.push({
        name: "Hammer",
        bias: "bullish",
        startIndex: i,
        endIndex: i,
        invalidation: c.low,
      });
    }
    if (hammerShape && prev && pg?.bullish) {
      found.push({
        name: "Hanging Man",
        bias: "bearish",
        startIndex: i,
        endIndex: i,
        invalidation: c.high,
      });
    }

    const inverted =
      g.upper >= g.body * 2 &&
      g.upper >= g.range * 0.5 &&
      g.lower <= g.upper * 0.4 &&
      Math.min(c.open, c.close) <= c.high - g.range * 0.55;

    if (inverted && prev && pg?.bearish) {
      found.push({
        name: "Inverted Hammer",
        bias: "bullish",
        startIndex: i,
        endIndex: i,
        invalidation: c.low,
      });
    }
    if (inverted && prev && pg?.bullish) {
      found.push({
        name: "Shooting Star",
        bias: "bearish",
        startIndex: i,
        endIndex: i,
        invalidation: c.high,
      });
    }

    if (
      prev &&
      pg?.bearish &&
      g.bullish &&
      c.open <= prev.close &&
      c.close >= prev.open &&
      g.body > pg.body
    ) {
      found.push({
        name: "Bullish Engulfing",
        bias: "bullish",
        startIndex: i - 1,
        endIndex: i,
        invalidation: Math.min(prev.low, c.low),
      });
    }

    if (
      prev &&
      pg?.bullish &&
      g.bearish &&
      c.open >= prev.close &&
      c.close <= prev.open &&
      g.body > pg.body
    ) {
      found.push({
        name: "Bearish Engulfing",
        bias: "bearish",
        startIndex: i - 1,
        endIndex: i,
        invalidation: Math.max(prev.high, c.high),
      });
    }

    if (
      prev &&
      pg?.bearish &&
      g.bullish &&
      c.open < prev.low &&
      c.close > midpoint(prev.open, prev.close) &&
      c.close < prev.open
    ) {
      found.push({
        name: "Piercing Line",
        bias: "bullish",
        startIndex: i - 1,
        endIndex: i,
        invalidation: Math.min(prev.low, c.low),
      });
    }

    if (
      prev &&
      pg?.bullish &&
      g.bearish &&
      c.open > prev.high &&
      c.close < midpoint(prev.open, prev.close) &&
      c.close > prev.open
    ) {
      found.push({
        name: "Dark Cloud Cover",
        bias: "bearish",
        startIndex: i - 1,
        endIndex: i,
        invalidation: Math.max(prev.high, c.high),
      });
    }

    if (prev && prev2 && p2g && pg) {
      if (
        p2g.bearish &&
        pg.body < p2g.body * 0.5 &&
        g.bullish &&
        c.close > midpoint(prev2.open, prev2.close)
      ) {
        found.push({
          name: "Morning Star",
          bias: "bullish",
          startIndex: i - 2,
          endIndex: i,
          invalidation: Math.min(prev2.low, prev.low, c.low),
        });
      }
      if (
        p2g.bullish &&
        pg.body < p2g.body * 0.5 &&
        g.bearish &&
        c.close < midpoint(prev2.open, prev2.close)
      ) {
        found.push({
          name: "Evening Star",
          bias: "bearish",
          startIndex: i - 2,
          endIndex: i,
          invalidation: Math.max(prev2.high, prev.high, c.high),
        });
      }
    }

    if (i >= 2 && prev && prev2) {
      const a = geom(prev2);
      const b = geom(prev);
      const solid = (x: typeof a) => x.body / x.range > 0.45;
      if (
        solid(a) &&
        solid(b) &&
        solid(g) &&
        a.bullish &&
        b.bullish &&
        g.bullish &&
        prev2.close < prev.close &&
        prev.close < c.close &&
        prev.open >= prev2.open &&
        c.open >= prev.open
      ) {
        found.push({
          name: "Three White Soldiers",
          bias: "bullish",
          startIndex: i - 2,
          endIndex: i,
          invalidation: Math.min(prev2.low, prev.low, c.low),
        });
      }
      if (
        solid(a) &&
        solid(b) &&
        solid(g) &&
        a.bearish &&
        b.bearish &&
        g.bearish &&
        prev2.close > prev.close &&
        prev.close > c.close &&
        prev.open <= prev2.open &&
        c.open <= prev.open
      ) {
        found.push({
          name: "Three Black Crows",
          bias: "bearish",
          startIndex: i - 2,
          endIndex: i,
          invalidation: Math.max(prev2.high, prev.high, c.high),
        });
      }
    }
  }

  const best = new Map<number, RawHit>();
  for (const hit of found) {
    const current = best.get(hit.endIndex);
    if (!current || (RANK[hit.name] ?? 0) > (RANK[current.name] ?? 0)) {
      best.set(hit.endIndex, hit);
    }
  }
  return [...best.values()].sort((a, b) => a.endIndex - b.endIndex);
}

export const DETECTED_PATTERN_NAMES = Object.keys(RANK);

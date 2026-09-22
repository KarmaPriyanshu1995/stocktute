import type { Ohlcv } from "./types";

export type Levels = {
  support: number[];
  resistance: number[];
};

/**
 * Swing highs/lows with a 2-bar pivot, then keep the nearest few supports
 * (below price) and resistances (above price).
 */
export function findSupportResistance(
  candles: Ohlcv[],
  atIndex: number,
  opts?: { pivot?: number; maxEach?: number },
): Levels {
  const pivot = opts?.pivot ?? 2;
  const maxEach = opts?.maxEach ?? 4;
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = pivot; i <= atIndex - pivot; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= pivot; j++) {
      if (candles[i].high <= candles[i - j].high || candles[i].high <= candles[i + j].high) isHigh = false;
      if (candles[i].low >= candles[i - j].low || candles[i].low >= candles[i + j].low) isLow = false;
    }
    if (isHigh) highs.push(candles[i].high);
    if (isLow) lows.push(candles[i].low);
  }

  const price = candles[atIndex].close;
  const support = uniqueSorted(
    lows.filter((l) => l < price),
    (a, b) => b - a,
  ).slice(0, maxEach);
  const resistance = uniqueSorted(
    highs.filter((h) => h > price),
    (a, b) => a - b,
  ).slice(0, maxEach);

  return { support, resistance };
}

function uniqueSorted(values: number[], compare: (a: number, b: number) => number): number[] {
  const clustered: number[] = [];
  const sorted = [...values].sort(compare);
  for (const v of sorted) {
    const near = clustered.find((c) => Math.abs(c - v) / v < 0.004);
    if (!near) clustered.push(v);
  }
  return clustered;
}

export function nearest(levels: number[]): number | null {
  return levels[0] ?? null;
}

export function distancePct(price: number, level: number | null): number | null {
  if (level == null || price === 0) return null;
  return ((price - level) / price) * 100;
}

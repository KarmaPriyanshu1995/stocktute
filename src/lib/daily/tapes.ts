import { append, drift, fromRows } from "@/lib/detection/fixtures";
import type { Ohlcv } from "@/lib/detection/types";
import { generateHistory } from "@/lib/priceFeed/generateHistory";
import { sessionCloseUnix } from "./calendar";
import { CONSTITUENT_SYMBOLS, INDEX_SYMBOLS, startPrice } from "./universe";

export type SymbolTape = {
  symbol: string;
  candles: Ohlcv[];
};

function alignToClose(candles: Ohlcv[], lastTime: number): Ohlcv[] {
  const n = candles.length;
  return candles.map((c, i) => ({ ...c, time: lastTime - (n - 1 - i) * 86_400 }));
}

function indexTape(symbol: (typeof INDEX_SYMBOLS)[number], date: string): SymbolTape {
  const closeMs = sessionCloseUnix(date) * 1000;
  const candles = generateHistory(symbol, "1D", 80, closeMs).map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
  return { symbol, candles };
}

/** Strong hammer with follow-through — Pattern of the Day candidate. */
function strongHammer(symbol: string, lastTime: number): Ohlcv[] {
  const px = startPrice(symbol);
  const step = px * 0.004;
  const row: [number, number, number, number, number] = [
    px * 0.34,
    px * 0.3406,
    px * 0.332,
    px * 0.3397,
    22_000,
  ];
  return alignToClose(
    append(append(drift(45, px * 0.46, -step, lastTime, 9_000), fromRows([row])), drift(10, row[3], step * 0.7, lastTime, 11_000)),
    lastTime,
  );
}

/** Same wick, light volume, almost no prior decline — trap. */
function weakHammer(symbol: string, lastTime: number): Ohlcv[] {
  const px = startPrice(symbol);
  const row: [number, number, number, number, number] = [
    px * 0.34,
    px * 0.3406,
    px * 0.332,
    px * 0.3397,
    3_200,
  ];
  return alignToClose(
    append(
      append(drift(45, px * 0.352, -px * 0.00025, lastTime, 4_000), fromRows([row])),
      drift(10, row[3], -px * 0.0005, lastTime, 3_500),
    ),
    lastTime,
  );
}

function shootingStarTape(symbol: string, lastTime: number): Ohlcv[] {
  const px = startPrice(symbol);
  const step = px * 0.003;
  const star: [number, number, number, number, number] = [px * 0.4, px * 0.413, px * 0.399, px * 0.401, 12_000];
  return alignToClose(
    append(append(drift(45, px * 0.34, step, lastTime, 8_000), fromRows([star])), drift(10, star[3], -step * 0.5, lastTime, 9_000)),
    lastTime,
  );
}

function bearishEngulfingTape(symbol: string, lastTime: number): Ohlcv[] {
  const px = startPrice(symbol);
  const step = px * 0.003;
  const pair: Array<[number, number, number, number, number]> = [
    [px * 0.392, px * 0.405, px * 0.391, px * 0.403, 9_000],
    [px * 0.404, px * 0.405, px * 0.39, px * 0.3905, 14_000],
  ];
  return alignToClose(
    append(append(drift(44, px * 0.33, step, lastTime, 8_000), fromRows(pair)), drift(10, pair[1][3], -step * 0.4, lastTime, 8_500)),
    lastTime,
  );
}

function dojiTape(symbol: string, lastTime: number): Ohlcv[] {
  const px = startPrice(symbol);
  const step = px * 0.001;
  const doji: [number, number, number, number, number] = [px * 0.4, px * 0.405, px * 0.395, px * 0.4002, 7_000];
  return alignToClose(
    append(append(drift(50, px * 0.38, step, lastTime, 6_000), fromRows([doji])), drift(8, doji[3], 0, lastTime, 6_000)),
    lastTime,
  );
}

function walkTape(symbol: string, date: string): SymbolTape {
  const closeMs = sessionCloseUnix(date) * 1000;
  const candles = generateHistory(symbol, "1D", 80, closeMs).map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
  return { symbol, candles };
}

/**
 * Deterministic EOD stand-in. Indices come from generateHistory; a few
 * constituents get fixture overlays so the picker always has a clean
 * pattern, a trap, and mixed bias without inventing detections.
 */
export function buildUniverseTapes(date: string): SymbolTape[] {
  const lastTime = sessionCloseUnix(date);
  const overlays: Record<string, Ohlcv[]> = {
    RELIANCE: strongHammer("RELIANCE", lastTime),
    TCS: weakHammer("TCS", lastTime),
    HDFCBANK: shootingStarTape("HDFCBANK", lastTime),
    ICICIBANK: bearishEngulfingTape("ICICIBANK", lastTime),
    ITC: dojiTape("ITC", lastTime),
  };

  const indices = INDEX_SYMBOLS.map((symbol) => indexTape(symbol, date));
  const names = CONSTITUENT_SYMBOLS.map((symbol) =>
    overlays[symbol] ? { symbol, candles: overlays[symbol] } : walkTape(symbol, date),
  );
  return [...indices, ...names];
}

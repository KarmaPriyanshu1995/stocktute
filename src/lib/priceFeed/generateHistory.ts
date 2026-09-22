import type { Timeframe } from "./timeframes";
import { TIMEFRAME_SECONDS } from "./candleBuilder";
import { REFERENCE_PRICES } from "./referencePrices";

export type HistoryCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function bar(
  time: number,
  open: number,
  close: number,
  lowerWick: number,
  upperWick: number,
  volume: number,
): HistoryCandle {
  const high = Math.max(open, close) + upperWick;
  const low = Math.min(open, close) - lowerWick;
  return {
    time,
    open: roundPrice(open),
    high: roundPrice(high),
    low: roundPrice(low),
    close: roundPrice(close),
    volume,
  };
}

function previousOpenTime(time: number, timeframe: Timeframe): number {
  if (timeframe !== "1D") return time - TIMEFRAME_SECONDS[timeframe];

  let t = time - TIMEFRAME_SECONDS["1D"];
  while (true) {
    const day = new Date(t * 1000).getUTCDay();
    if (day !== 0 && day !== 6) return t;
    t -= TIMEFRAME_SECONDS["1D"];
  }
}

function buildTimes(timeframe: Timeframe, count: number, now = Date.now()): number[] {
  const times: number[] = [];
  let t = Math.floor(now / 1000);
  t = Math.floor(t / TIMEFRAME_SECONDS[timeframe]) * TIMEFRAME_SECONDS[timeframe];
  if (timeframe === "1D") {
    const day = new Date(t * 1000).getUTCDay();
    if (day === 0) t -= 2 * TIMEFRAME_SECONDS["1D"];
    if (day === 6) t -= TIMEFRAME_SECONDS["1D"];
  }
  for (let i = 0; i < count; i++) {
    times.push(t);
    t = previousOpenTime(t, timeframe);
  }
  return times.reverse();
}

type PatternKind =
  | "walk"
  | "doji"
  | "hammer"
  | "shootingStar"
  | "bullishEngulfing"
  | "bearishEngulfing"
  | "morningStar"
  | "eveningStar"
  | "piercing"
  | "darkCloud"
  | "soldiers"
  | "crows"
  | "marubozu";

const PATTERN_ROTATION: PatternKind[] = [
  "hammer",
  "bullishEngulfing",
  "doji",
  "shootingStar",
  "bearishEngulfing",
  "morningStar",
  "eveningStar",
  "piercing",
  "darkCloud",
  "soldiers",
  "crows",
  "marubozu",
];

function vol(rand: () => number): number {
  return Math.floor(8_000 + rand() * 40_000);
}

function randomWalkBar(time: number, price: number, rand: () => number, bearishBias: boolean): HistoryCandle {
  const range = price * (0.006 + rand() * 0.01);
  const dir = rand() < (bearishBias ? 0.68 : 0.32) ? -1 : 1;
  const close = price + dir * range * (0.35 + rand() * 0.55);
  const lower = range * (0.15 + rand() * 0.45);
  const upper = range * (0.15 + rand() * 0.45);
  return bar(time, price, close, lower, upper, vol(rand));
}

function paintPattern(
  kind: PatternKind,
  times: number[],
  start: number,
  price: number,
  rand: () => number,
): HistoryCandle[] {
  const t = (offset: number) => times[start + offset];
  const v = () => vol(rand);

  switch (kind) {
    case "doji": {
      const wick = price * 0.008;
      return [bar(t(0), price, price * 1.0004, wick, wick, v())];
    }
    case "hammer": {
      const lead = randomWalkBar(t(0), price, rand, true);
      const open = lead.close;
      const close = open * 1.0015;
      const lower = open * 0.018;
      return [lead, bar(t(1), open, close, lower, open * 0.001, v())];
    }
    case "shootingStar": {
      const lead = randomWalkBar(t(0), price, rand, false);
      const open = lead.close;
      const close = open * 0.9985;
      const upper = open * 0.018;
      return [lead, bar(t(1), open, close, open * 0.001, upper, v())];
    }
    case "bullishEngulfing": {
      const first = bar(t(0), price, price * 0.988, price * 0.002, price * 0.001, v());
      const second = bar(t(1), first.close * 0.999, price * 1.006, price * 0.002, price * 0.002, v());
      return [first, second];
    }
    case "bearishEngulfing": {
      const first = bar(t(0), price, price * 1.012, price * 0.001, price * 0.002, v());
      const second = bar(t(1), first.close * 1.001, price * 0.994, price * 0.002, price * 0.002, v());
      return [first, second];
    }
    case "morningStar": {
      const first = bar(t(0), price, price * 0.982, price * 0.002, price * 0.001, v());
      const star = bar(t(1), first.close * 0.999, first.close * 1.0005, price * 0.004, price * 0.004, v());
      const third = bar(t(2), star.close * 1.001, price * 1.004, price * 0.002, price * 0.002, v());
      return [first, star, third];
    }
    case "eveningStar": {
      const first = bar(t(0), price, price * 1.018, price * 0.001, price * 0.002, v());
      const star = bar(t(1), first.close * 1.001, first.close * 0.9995, price * 0.004, price * 0.004, v());
      const third = bar(t(2), star.close * 0.999, price * 0.996, price * 0.002, price * 0.002, v());
      return [first, star, third];
    }
    case "piercing": {
      const first = bar(t(0), price, price * 0.985, price * 0.002, price * 0.001, v());
      const second = bar(t(1), first.low * 0.998, price * 0.996, price * 0.001, price * 0.002, v());
      return [first, second];
    }
    case "darkCloud": {
      const first = bar(t(0), price, price * 1.015, price * 0.001, price * 0.002, v());
      const second = bar(t(1), first.high * 1.002, price * 1.004, price * 0.002, price * 0.001, v());
      return [first, second];
    }
    case "soldiers": {
      const a = bar(t(0), price, price * 1.008, price * 0.001, price * 0.002, v());
      const b = bar(t(1), a.close * 0.999, a.close * 1.008, price * 0.001, price * 0.002, v());
      const c = bar(t(2), b.close * 0.999, b.close * 1.008, price * 0.001, price * 0.002, v());
      return [a, b, c];
    }
    case "crows": {
      const a = bar(t(0), price, price * 0.992, price * 0.002, price * 0.001, v());
      const b = bar(t(1), a.close * 1.001, a.close * 0.992, price * 0.002, price * 0.001, v());
      const c = bar(t(2), b.close * 1.001, b.close * 0.992, price * 0.002, price * 0.001, v());
      return [a, b, c];
    }
    case "marubozu": {
      const dir = rand() < 0.5 ? 1 : -1;
      const close = price * (1 + dir * 0.012);
      return [bar(t(0), price, close, price * 0.0004, price * 0.0004, v())];
    }
    default:
      return [randomWalkBar(t(0), price, rand, rand() < 0.5)];
  }
}

function patternWidth(kind: PatternKind): number {
  if (kind === "morningStar" || kind === "eveningStar" || kind === "soldiers" || kind === "crows") return 3;
  if (kind === "doji" || kind === "marubozu" || kind === "walk") return 1;
  return 2;
}

/**
 * Builds a seeded OHLC series with visible bodies/wicks and textbook
 * candlestick patterns so the classroom has something to study even when
 * Mongo history is empty or the live worker only emits one tick per bar.
 */
export function generateHistory(
  symbol: string,
  timeframe: Timeframe,
  count = 240,
  now = Date.now(),
): HistoryCandle[] {
  const rand = mulberry32(hashString(`${symbol}:${timeframe}`));
  const times = buildTimes(timeframe, count, now);
  const candles: HistoryCandle[] = [];
  let price = REFERENCE_PRICES[symbol] ?? 1000;
  let i = 0;
  let rotation = 0;

  while (i < times.length) {
    const remaining = times.length - i;
    const inject = i > 8 && remaining > 4 && i % 16 === 0;
    const kind = inject ? PATTERN_ROTATION[rotation % PATTERN_ROTATION.length] : "walk";
    if (inject) rotation += 1;

    const width = Math.min(patternWidth(kind), remaining);
    const painted = paintPattern(kind, times, i, price, rand).slice(0, width);
    for (const candle of painted) {
      candles.push({ ...candle, time: times[i] });
      price = candle.close;
      i += 1;
    }
  }

  return candles;
}

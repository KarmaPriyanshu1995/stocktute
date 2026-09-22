import type { Quote } from "./PriceProvider";
import type { Timeframe } from "./timeframes";

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1D": 86_400,
};

export type BuildingCandle = {
  symbol: string;
  timeframe: Timeframe;
  time: number; // bucket open time (unix seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/** Floors a unix timestamp to the start of its timeframe bucket. */
export function bucketStart(timestamp: number, timeframe: Timeframe): number {
  const size = TIMEFRAME_SECONDS[timeframe];
  return Math.floor(timestamp / size) * size;
}

/**
 * In-memory OHLCV aggregator keyed by symbol+timeframe. Feed it quotes as
 * they arrive; it returns the candle that just closed whenever a tick rolls
 * into a new bucket, or null while the current bucket is still forming.
 *
 * Kept separate from persistence so it can be unit-tested with plain data
 * and reused identically by the live worker and by replay/backfill jobs.
 */
export class CandleBuilder {
  private open = new Map<string, BuildingCandle>();

  constructor(private readonly timeframes: readonly Timeframe[]) {}

  private key(symbol: string, timeframe: Timeframe): string {
    return `${symbol}:${timeframe}`;
  }

  /** Feeds one quote in; returns any candles that closed as a result. */
  ingest(quote: Quote): BuildingCandle[] {
    const closed: BuildingCandle[] = [];

    for (const timeframe of this.timeframes) {
      const key = this.key(quote.symbol, timeframe);
      const bucket = bucketStart(quote.timestamp, timeframe);
      const current = this.open.get(key);

      if (!current || current.time !== bucket) {
        if (current) closed.push(current);
        this.open.set(key, {
          symbol: quote.symbol,
          timeframe,
          time: bucket,
          open: quote.price,
          high: quote.price,
          low: quote.price,
          close: quote.price,
          volume: 0,
        });
      }

      const candle = this.open.get(key)!;
      candle.high = Math.max(candle.high, quote.price);
      candle.low = Math.min(candle.low, quote.price);
      candle.close = quote.price;
      candle.volume += 1; // per-tick volume proxy; replaced by real traded volume deltas with a licensed feed
    }

    return closed;
  }

  /** Returns the still-forming candle for a symbol/timeframe, if any (for live chart updates). */
  getForming(symbol: string, timeframe: Timeframe): BuildingCandle | undefined {
    return this.open.get(this.key(symbol, timeframe));
  }
}

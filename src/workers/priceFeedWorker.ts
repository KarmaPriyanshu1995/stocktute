/**
 * Standalone Node worker: polls the configured PriceProvider, builds
 * 1m/5m/15m/1D candles, persists closed candles to Mongo, and writes the
 * latest quote + forming candle to Redis for the SSE endpoint to serve.
 *
 * Run with: npx tsx src/workers/priceFeedWorker.ts
 */
import "dotenv/config";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Candle, TIMEFRAMES } from "@/models/Candle";
import { getRedis, redisKeys } from "@/lib/redis/client";
import { MockNseProvider } from "@/lib/priceFeed/MockNseProvider";
import { CandleBuilder } from "@/lib/priceFeed/candleBuilder";
import type { PriceProvider } from "@/lib/priceFeed/PriceProvider";

const POLL_INTERVAL_MS = Number(process.env.PRICE_FEED_POLL_INTERVAL_MS ?? 2_000);
const symbols = (process.env.PRICE_FEED_SYMBOLS ?? "").split(",").filter(Boolean);

async function persistClosedCandle(
  symbol: string,
  timeframe: (typeof TIMEFRAMES)[number],
  candle: { time: number; open: number; high: number; low: number; close: number; volume: number },
) {
  await Candle.updateOne(
    { symbol, timeframe, time: candle.time },
    { $set: candle },
    { upsert: true },
  );
}

async function tick(provider: PriceProvider, builder: CandleBuilder) {
  const redis = getRedis();
  const quotes = await provider.getQuotes();

  for (const quote of quotes) {
    await redis.set(redisKeys.latestQuoteKey(quote.symbol), JSON.stringify(quote), { ex: 120 });

    const closed = builder.ingest(quote);
    for (const candle of closed) {
      await persistClosedCandle(candle.symbol, candle.timeframe, candle);
    }

    for (const timeframe of TIMEFRAMES) {
      const forming = builder.getForming(quote.symbol, timeframe);
      if (forming) {
        await redis.set(
          redisKeys.formingCandleKey(quote.symbol, timeframe),
          JSON.stringify(forming),
          { ex: 120 },
        );
      }
    }
  }

  console.log(`[priceFeedWorker] tick: ${quotes.length} quotes @ ${new Date().toISOString()}`);
}

async function main() {
  await connectToDatabase();
  const provider = new MockNseProvider(symbols.length ? symbols : undefined);
  const builder = new CandleBuilder(TIMEFRAMES);

  console.log(`[priceFeedWorker] starting, polling every ${POLL_INTERVAL_MS}ms for: ${provider.symbols.join(", ")}`);

  await tick(provider, builder);
  setInterval(() => {
    tick(provider, builder).catch((err) => console.error("[priceFeedWorker] tick failed", err));
  }, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[priceFeedWorker] fatal", err);
  process.exit(1);
});

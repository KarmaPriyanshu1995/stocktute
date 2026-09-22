import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** Lazily-created singleton Upstash Redis client, used for hot price cache and rate limits. */
export function getRedis(): Redis {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set");
  }

  client = new Redis({ url, token });
  return client;
}

const latestQuoteKey = (symbol: string) => `quote:latest:${symbol}`;
const formingCandleKey = (symbol: string, timeframe: string) => `candle:forming:${symbol}:${timeframe}`;

export const redisKeys = { latestQuoteKey, formingCandleKey };

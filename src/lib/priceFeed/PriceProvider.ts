export type Quote = {
  symbol: string;
  price: number;
  volume: number; // cumulative traded volume for the session, as reported by the source
  timestamp: number; // unix seconds
};

/**
 * Abstraction over any source of live/delayed price data. Phase 1 ships
 * `MockNseProvider` (a seeded random walk) so the rest of the platform —
 * candle building, caching, SSE streaming, charts — can be built and tested
 * without a licensed feed. Swapping to a real NSE-delayed or broker feed
 * later means writing one new class that implements this interface.
 */
export interface PriceProvider {
  /** Symbols this provider is configured to serve, e.g. ["RELIANCE", "TCS"]. */
  readonly symbols: readonly string[];

  /** Fetch the latest quote for every configured symbol in one call. */
  getQuotes(): Promise<Quote[]>;
}

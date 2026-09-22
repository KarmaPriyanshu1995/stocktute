import type { PriceProvider, Quote } from "./PriceProvider";
import { REFERENCE_PRICES } from "./referencePrices";

type SymbolState = {
  price: number;
  volume: number;
};

/**
 * Seeded random-walk price generator standing in for a licensed NSE feed.
 * Deterministic per-process (not cross-restart) so behavior is repeatable
 * within a dev session while still producing realistic-looking candles.
 */
export class MockNseProvider implements PriceProvider {
  readonly symbols: readonly string[];
  private state: Map<string, SymbolState>;

  constructor(symbols?: readonly string[]) {
    this.symbols = symbols ?? Object.keys(REFERENCE_PRICES);
    this.state = new Map(
      this.symbols.map((symbol) => [
        symbol,
        { price: REFERENCE_PRICES[symbol] ?? 1000, volume: 0 },
      ]),
    );
  }

  async getQuotes(): Promise<Quote[]> {
    const timestamp = Math.floor(Date.now() / 1000);

    return this.symbols.map((symbol) => {
      const s = this.state.get(symbol);
      if (!s) throw new Error(`Unknown symbol: ${symbol}`);

      // Random walk: small per-tick moves so a 1m bar (many ticks) gets a real body + wicks.
      const reference = REFERENCE_PRICES[symbol] ?? s.price;
      const drift = (reference - s.price) * 0.002;
      const noise = s.price * (Math.random() - 0.5) * 0.0024;
      s.price = Math.max(1, s.price + drift + noise);

      const tickVolume = Math.floor(500 + Math.random() * 5000);
      s.volume += tickVolume;

      return {
        symbol,
        price: Math.round(s.price * 100) / 100,
        volume: s.volume,
        timestamp,
      };
    });
  }
}

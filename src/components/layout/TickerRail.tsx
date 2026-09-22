"use client";

import { useLiveQuotes } from "@/lib/priceFeed/useLiveQuotes";
import { cn } from "@/lib/utils";

const RAIL_SYMBOLS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "SBIN",
  "BHARTIARTL",
  "ITC",
  "KOTAKBANK",
] as const;

export function TickerRail() {
  const quotes = useLiveQuotes(RAIL_SYMBOLS);
  const entries = RAIL_SYMBOLS.map((symbol) => quotes[symbol]).filter(Boolean);

  return (
    <div className="w-full overflow-hidden border-b border-bg-border bg-bg-base">
      <div className="flex animate-[scroll_40s_linear_infinite] gap-8 whitespace-nowrap py-2">
        {[...entries, ...entries].map((quote, i) => (
          <span key={`${quote.symbol}-${i}`} className="flex items-center gap-2 font-mono text-xs">
            <span className="text-text-secondary">{quote.symbol}</span>
            <span className="text-text-primary">₹{quote.price.toFixed(2)}</span>
          </span>
        ))}
        {entries.length === 0 && (
          <span className="font-mono text-xs text-text-tertiary">Connecting to live feed…</span>
        )}
      </div>
    </div>
  );
}

export function priceChangeClass(current: number, previous: number) {
  return cn(
    "font-mono tabular-nums",
    current > previous && "text-price-up",
    current < previous && "text-price-down",
    current === previous && "text-price-flat",
  );
}

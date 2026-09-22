import { REFERENCE_PRICES } from "@/lib/priceFeed/referencePrices";

export const INDEX_SYMBOLS = ["NIFTY", "BANKNIFTY"] as const;

/** Stand-in NIFTY 50 sample until a licensed constituent list is wired. */
export const CONSTITUENT_SYMBOLS = [
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

export const DAILY_SYMBOLS = [...INDEX_SYMBOLS, ...CONSTITUENT_SYMBOLS];

export const INDEX_START: Record<(typeof INDEX_SYMBOLS)[number], number> = {
  NIFTY: 24_800,
  BANKNIFTY: 52_400,
};

export function startPrice(symbol: string): number {
  if (symbol in INDEX_START) return INDEX_START[symbol as keyof typeof INDEX_START];
  return REFERENCE_PRICES[symbol] ?? 1000;
}

export const SECTION_META = [
  { id: "market-story", minLevel: 1, title: "Market Story" },
  { id: "pattern-of-day", minLevel: 2, title: "Pattern of the Day" },
  { id: "predict-reveal", minLevel: 2, title: "Yesterday's Predict-and-Reveal" },
  { id: "spot-it", minLevel: 3, title: "Spot It Yourself" },
  { id: "trap", minLevel: 4, title: "Trap of the Day" },
  { id: "risk-drill", minLevel: 6, title: "Risk Drill" },
  { id: "rule-check", minLevel: 7, title: "Rule Check" },
  { id: "quiz", minLevel: 1, title: "Daily Quiz" },
] as const;

export type SectionId = (typeof SECTION_META)[number]["id"];

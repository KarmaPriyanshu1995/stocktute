import { describe, expect, it } from "vitest";
import { detectCandlestickPatterns } from "@/lib/charts/candlestickPatterns";
import { generateHistory } from "@/lib/priceFeed/generateHistory";

describe("detectCandlestickPatterns", () => {
  it("finds a bullish engulfing", () => {
    const candles = [
      { time: 1, open: 100, high: 100.2, low: 97.5, close: 98 },
      { time: 2, open: 97.8, high: 101, low: 97.6, close: 100.5 },
    ];
    const names = detectCandlestickPatterns(candles).map((p) => p.name);
    expect(names).toContain("Bullish Engulfing");
  });

  it("finds a hammer after a decline", () => {
    const candles = [
      { time: 1, open: 102, high: 102.2, low: 100.4, close: 100.5 },
      { time: 2, open: 100.4, high: 100.6, low: 98.2, close: 100.3 },
    ];
    const names = detectCandlestickPatterns(candles).map((p) => p.name);
    expect(names).toContain("Hammer");
  });

  it("labels a doji", () => {
    const candles = [
      { time: 1, open: 100, high: 100.8, low: 99.2, close: 100.05 },
    ];
    expect(detectCandlestickPatterns(candles).map((p) => p.name)).toContain("Doji");
  });
});

describe("generateHistory", () => {
  it("builds enough study candles with real bodies and patterns", () => {
    const candles = generateHistory("RELIANCE", "15m", 240, Date.UTC(2026, 8, 21, 12));
    expect(candles).toHaveLength(240);
    expect(candles.every((c) => c.high >= Math.max(c.open, c.close))).toBe(true);
    expect(candles.every((c) => c.low <= Math.min(c.open, c.close))).toBe(true);
    const bodied = candles.filter((c) => Math.abs(c.close - c.open) > 0).length;
    expect(bodied).toBeGreaterThan(150);
    const patterns = detectCandlestickPatterns(candles);
    expect(patterns.length).toBeGreaterThan(5);
  });
});

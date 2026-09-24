import { describe, expect, it } from "vitest";
import { ema, rsi, sma, atr } from "@/lib/detection/indicators";
import { priorTrend } from "@/lib/detection/trend";
import { findSupportResistance } from "@/lib/detection/levels";
import { detectRawPatterns } from "@/lib/detection/patterns";
import { analyzeChart } from "@/lib/detection/engine";
import { tallyBaseRates } from "@/lib/detection/baseRates";
import { hitExpected } from "@/lib/detection/outcomes";
import { append, drift, fromRows } from "./fixtures";

describe("indicators", () => {
  it("SMA of a flat series equals the level", () => {
    const sma5 = sma([2, 2, 2, 2, 2, 2], 5);
    expect(sma5[4]).toBe(2);
    expect(sma5[3]).toBeNull();
  });

  it("EMA of a constant series equals the constant once seeded", () => {
    const values = Array(30).fill(50);
    const series = ema(values, 20);
    expect(series[19]).toBeCloseTo(50);
    expect(series[29]).toBeCloseTo(50);
  });

  it("RSI is 100 when every close is higher", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const series = rsi(closes, 14);
    expect(series[14]).toBe(100);
    expect(series[13]).toBeNull();
  });

  it("Wilder ATR seeds after 14 true ranges", () => {
    const candles = Array.from({ length: 20 }, (_, i) => ({
      high: 12,
      low: 10,
      close: 11,
    }));
    candles[0] = { high: 12, low: 10, close: 11 };
    const series = atr(candles, 14);
    expect(series[13]).toBeNull();
    expect(series[14]).toBeCloseTo(2);
    expect(series[19]).toBeCloseTo(2);
  });
});

describe("trend and levels", () => {
  it("labels a 20-bar selloff as down", () => {
    const candles = drift(25, 120, -1);
    expect(priorTrend(candles, 24)).toBe("down");
  });

  it("finds a swing low as support under the last close", () => {
    const down = drift(10, 110, -2);
    const trough = fromRows([[90, 90.5, 88, 90, 20_000]]);
    const up = drift(8, 90, 2);
    const candles = append(append(down, trough), up);
    const { support } = findSupportResistance(candles, candles.length - 1);
    expect(support[0]).toBeLessThan(candles.at(-1)!.close);
    expect(support[0]).toBeLessThanOrEqual(90.5);
  });
});

describe("pattern scanners", () => {
  it("detects a hammer after a decline", () => {
    const candles = append(drift(8, 110, -1), fromRows([[100.4, 100.6, 98.2, 100.3]]));
    const hit = detectRawPatterns(candles).find((h) => h.name === "Hammer");
    expect(hit).toBeDefined();
    expect(hit?.startIndex).toBe(hit?.endIndex);
    expect(hit?.invalidation).toBe(98.2);
  });

  it("detects a hanging man after a rally", () => {
    const candles = append(drift(8, 90, 1), fromRows([[100.4, 100.6, 98.2, 100.3]]));
    expect(detectRawPatterns(candles).some((h) => h.name === "Hanging Man")).toBe(true);
  });

  it("detects an inverted hammer after a decline", () => {
    const candles = append(drift(8, 110, -1), fromRows([[100.2, 103.5, 100.0, 100.4]]));
    expect(detectRawPatterns(candles).some((h) => h.name === "Inverted Hammer")).toBe(true);
  });

  it("detects a shooting star after a rally", () => {
    const candles = append(drift(8, 90, 1), fromRows([[100.2, 103.5, 100.0, 100.4]]));
    expect(detectRawPatterns(candles).some((h) => h.name === "Shooting Star")).toBe(true);
  });

  it("detects bullish engulfing", () => {
    const candles = fromRows([
      [100, 100.3, 97.4, 97.8],
      [97.6, 101.2, 97.5, 100.8],
    ]);
    const hit = detectRawPatterns(candles).find((h) => h.name === "Bullish Engulfing");
    expect(hit?.startIndex).toBe(0);
    expect(hit?.endIndex).toBe(1);
  });

  it("detects bearish engulfing", () => {
    const candles = fromRows([
      [98, 101.2, 97.8, 100.8],
      [101, 101.3, 97.4, 97.6],
    ]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Bearish Engulfing")).toBe(true);
  });

  it("detects piercing line", () => {
    const candles = fromRows([
      [100, 100.2, 97.6, 98],
      [97.4, 99.4, 97.3, 99.2],
    ]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Piercing Line")).toBe(true);
  });

  it("detects dark cloud cover", () => {
    const candles = fromRows([
      [98, 100.4, 97.8, 100.2],
      [100.6, 100.8, 98.6, 98.9],
    ]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Dark Cloud Cover")).toBe(true);
  });

  it("detects morning star", () => {
    const candles = fromRows([
      [100, 100.2, 96.8, 97],
      [96.9, 97.4, 96.4, 97.1],
      [97.2, 100.6, 97.1, 100.1],
    ]);
    const hit = detectRawPatterns(candles).find((h) => h.name === "Morning Star");
    expect(hit?.startIndex).toBe(0);
    expect(hit?.endIndex).toBe(2);
  });

  it("detects evening star", () => {
    const candles = fromRows([
      [97, 100.4, 96.8, 100.2],
      [100.3, 100.8, 99.8, 100.1],
      [100, 100.2, 96.6, 96.9],
    ]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Evening Star")).toBe(true);
  });

  it("detects three white soldiers", () => {
    const candles = fromRows([
      [100, 101.2, 99.8, 101],
      [100.9, 102.2, 100.8, 102],
      [101.9, 103.2, 101.8, 103],
    ]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Three White Soldiers")).toBe(true);
  });

  it("detects three black crows", () => {
    const candles = fromRows([
      [103, 103.2, 101.8, 102],
      [102.1, 102.2, 100.8, 101],
      [101.1, 101.2, 99.8, 100],
    ]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Three Black Crows")).toBe(true);
  });

  it("detects a doji", () => {
    const candles = fromRows([[100, 101.2, 98.8, 100.05]]);
    expect(detectRawPatterns(candles).some((h) => h.name === "Doji")).toBe(true);
  });
});

describe("analyzeChart", () => {
  const hammerChart = () => {
    const prefix = drift(40, 140, -0.8);
    const pattern = fromRows([[100.4, 100.6, 98.2, 100.3, 18_000]]);
    const future = drift(10, 100.3, 0.6);
    return append(append(prefix, pattern), future);
  };

  it("attaches context, confirmation, and 1/3/5/10 bar outcomes on a closed hammer", () => {
    const candles = hammerChart();
    const facts = analyzeChart({
      candles,
      symbol: "RELIANCE",
      timeframe: "1D",
      baseRates: {
        Hammer: { universe: "fixture", horizonBars: 5, sampleSize: 200, hitRate: 0.47 },
      },
    });

    const hammer = facts.setups.find((s) => s.name === "Hammer");
    expect(hammer).toBeDefined();
    expect(hammer!.context.priorTrend20).toBe("down");
    expect(hammer!.context.atr14).not.toBeNull();
    expect(facts.isSynthetic).toBe(true);
    expect(hammer!.context.rsi14).not.toBeNull();
    expect(hammer!.context.volumeVsAvg20).toBeGreaterThan(1);
    expect(hammer!.keyLevels.invalidation).toBe(98.2);
    expect(hammer!.confirmation).toBe("confirmed");
    expect(hammer!.forward.map((f) => f.bars)).toEqual([1, 3, 5, 10]);
    expect(hammer!.forward.every((f) => f.closeReturnPct != null)).toBe(true);
    expect(hammer!.forward[0]!.hitExpected).toBe(true);
    expect(hammer!.baseRate.hitRate).toBe(0.47);
    expect(facts.missingFacts.some((m) => m.includes("base rates"))).toBe(false);
  });

  it("marks confirmation unavailable when the next bar is not closed", () => {
    const candles = append(drift(12, 110, -1), fromRows([[100.4, 100.6, 98.2, 100.3]]));
    const hammer = analyzeChart({ candles }).setups.find((s) => s.name === "Hammer");
    expect(hammer?.confirmation).toBe("unavailable");
    expect(hammer?.forward[0]?.closeReturnPct).toBeNull();
  });

  it("does not invent base rates when none are supplied", () => {
    const facts = analyzeChart({ candles: hammerChart() });
    const hammer = facts.setups.find((s) => s.name === "Hammer");
    expect(hammer?.baseRate.sampleSize).toBe(0);
    expect(hammer?.baseRate.hitRate).toBeNull();
    expect(facts.missingFacts).toContain("Historical base rates were not supplied for this run.");
  });
});

describe("base rates and expected-move scoring", () => {
  it("treats a tiny move as sideways hit", () => {
    expect(hitExpected("sideways", 0.2)).toBe(true);
    expect(hitExpected("sideways", 1.2)).toBe(false);
    expect(hitExpected("up", -0.1)).toBe(false);
    expect(hitExpected("down", -0.1)).toBe(true);
  });

  it("tallies a 50% 5-bar hit rate from two labelled setups", () => {
    const table = tallyBaseRates(
      [
        {
          name: "Hammer",
          forward: [
            { bars: 1, closeReturnPct: 1, hitExpected: true },
            { bars: 5, closeReturnPct: 2, hitExpected: true },
          ],
        },
        {
          name: "Hammer",
          forward: [
            { bars: 1, closeReturnPct: -1, hitExpected: false },
            { bars: 5, closeReturnPct: -2, hitExpected: false },
          ],
        },
      ],
      "nifty50-fixture",
    );
    expect(table.Hammer.sampleSize).toBe(2);
    expect(table.Hammer.hitRate).toBe(0.5);
    expect(table.Hammer.universe).toBe("nifty50-fixture");
  });
});

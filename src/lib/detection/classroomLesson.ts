import { append, drift, fromRows } from "./fixtures";
import { analyzeChart } from "./engine";
import { CLASSROOM_DISCLAIMER, type ChartFacts, type DetectedSetup, type Ohlcv } from "./types";

export { CLASSROOM_DISCLAIMER };

export const HAMMER_PRIMARY_CHART_KEY = "classroom:hammer:RELIANCE:1D:primary";

export type LessonChart = {
  label: string;
  candles: Ohlcv[];
  facts: ChartFacts;
  setup: DetectedSetup;
};

export type ClassroomLesson = {
  chartKey: string;
  symbol: string;
  timeframe: "1D";
  studentLevel: number;
  primary: LessonChart;
  weak: LessonChart;
  failed: LessonChart;
  disclaimer: string;
};

const HAMMER_BASE_RATE = {
  Hammer: {
    universe: "synthetic-teaching-set",
    horizonBars: 5 as const,
    sampleSize: 80,
    hitRate: 0.46,
  },
};

function requireSetup(facts: ChartFacts, name: string, candles: Ohlcv[], label: string): LessonChart {
  const setup = facts.setups.find((s) => s.name === name);
  if (!setup) {
    throw new Error(`Classroom lesson "${label}" is missing a ${name} detection. Fix the fixture, do not invent a pattern.`);
  }
  return { label, candles, facts, setup };
}

/** One closed daily hammer: strong (near lows, heavy volume, follow-through), weak, and a failed twin. */
export function buildHammerClassroomLesson(studentLevel = 2): ClassroomLesson {
  const hammer = fromRows([[100.4, 100.6, 98.2, 100.3, 22_000]]);

  const primaryCandles = append(
    append(drift(45, 136, -0.8, 1_700_000_000, 9_000), hammer),
    drift(10, 100.3, 0.55, 1_700_000_000, 11_000),
  );
  const weakCandles = append(
    append(drift(45, 104, -0.08, 1_710_000_000, 4_000), fromRows([[100.4, 100.6, 98.2, 100.3, 3_200]])),
    drift(10, 100.3, -0.15, 1_710_000_000, 3_500),
  );
  const failedCandles = append(
    append(drift(45, 136, -0.8, 1_720_000_000, 9_000), fromRows([[100.4, 100.6, 98.2, 100.3, 7_500]])),
    drift(10, 100.3, -0.7, 1_720_000_000, 12_000),
  );

  return {
    chartKey: HAMMER_PRIMARY_CHART_KEY,
    symbol: "RELIANCE",
    timeframe: "1D",
    studentLevel,
    primary: requireSetup(
      analyzeChart({ candles: primaryCandles, symbol: "RELIANCE", timeframe: "1D", baseRates: HAMMER_BASE_RATE }),
      "Hammer",
      primaryCandles,
      "strong",
    ),
    weak: requireSetup(
      analyzeChart({ candles: weakCandles, symbol: "RELIANCE", timeframe: "1D", baseRates: HAMMER_BASE_RATE }),
      "Hammer",
      weakCandles,
      "weak",
    ),
    failed: requireSetup(
      analyzeChart({ candles: failedCandles, symbol: "RELIANCE", timeframe: "1D", baseRates: HAMMER_BASE_RATE }),
      "Hammer",
      failedCandles,
      "failed",
    ),
    disclaimer: CLASSROOM_DISCLAIMER,
  };
}

import { buildHammerClassroomLesson, HAMMER_PRIMARY_CHART_KEY } from "@/lib/detection/classroomLesson";
import type { DetectedSetup, Ohlcv } from "@/lib/detection/types";

export { HAMMER_PRIMARY_CHART_KEY };

export type TeachingChart = {
  chartKey: string;
  source: "classroom";
  symbol: string;
  timeframe: string;
  candles: Ohlcv[];
  setup: DetectedSetup;
};

/**
 * Server-side registry. Outcome and snapshot always come from the detection
 * engine — the client only submits direction, confidence, and reason.
 */
export function resolveTeachingChart(chartKey: string): TeachingChart | null {
  if (chartKey !== HAMMER_PRIMARY_CHART_KEY) return null;
  const lesson = buildHammerClassroomLesson(2);
  return {
    chartKey: HAMMER_PRIMARY_CHART_KEY,
    source: "classroom",
    symbol: lesson.symbol,
    timeframe: lesson.timeframe,
    candles: lesson.primary.candles,
    setup: lesson.primary.setup,
  };
}

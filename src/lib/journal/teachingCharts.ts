import {
  buildClassroomLesson,
  HAMMER_PRIMARY_CHART_KEY,
  parseChartKey,
} from "@/lib/detection/classroomLesson";
import type { DetectedSetup, Ohlcv } from "@/lib/detection/types";

export { HAMMER_PRIMARY_CHART_KEY };

export type TeachingChart = {
  chartKey: string;
  source: "classroom";
  symbol: string;
  timeframe: string;
  isSynthetic: true;
  candles: Ohlcv[];
  setup: DetectedSetup;
};

/**
 * Server-side registry. Outcome and snapshot always come from the detection
 * engine — the client only submits direction, confidence, and reason.
 */
export function resolveTeachingChart(chartKey: string): TeachingChart | null {
  if (!parseChartKey(chartKey)) return null;
  const lesson = buildClassroomLesson(chartKey);
  const chart =
    parseChartKey(chartKey)?.variant === "weak"
      ? lesson.weak
      : parseChartKey(chartKey)?.variant === "failed"
        ? lesson.failed
        : lesson.primary;
  return {
    chartKey,
    source: "classroom",
    symbol: lesson.symbol,
    timeframe: lesson.timeframe,
    isSynthetic: true,
    candles: chart.candles,
    setup: chart.setup,
  };
}

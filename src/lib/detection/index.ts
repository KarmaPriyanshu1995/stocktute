export type { ChartFacts, DetectedSetup, Ohlcv, AnalyzeChartInput } from "./types";
export { CLASSROOM_DISCLAIMER } from "./types";
export { analyzeChart } from "./engine";
export { detectRawPatterns, DETECTED_PATTERN_NAMES } from "./patterns";
export { ema, rsi, sma, atr } from "./indicators";
export { tallyBaseRates, isSyntheticUniverse } from "./baseRates";
export { priorTrend } from "./trend";
export { findSupportResistance } from "./levels";
export {
  buildClassroomLesson,
  buildHammerClassroomLesson,
  HAMMER_PRIMARY_CHART_KEY,
} from "./classroomLesson";
export { TEACHING_PATTERNS } from "./teachingFixtures";
export { narrateLayer, LAYERS } from "./narrate";

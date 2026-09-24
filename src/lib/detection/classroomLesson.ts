import { CLASSROOM_SESSION_DATE } from "@/config/education";
import { assertEducationalLag, lastBarSessionDate } from "@/lib/compliance/dataLag";
import { analyzeChart } from "./engine";
import {
  buildTeachingCandles,
  slugForPattern,
  TEACHING_PATTERNS,
  type TeachingPatternName,
  type TeachingVariant,
} from "./teachingFixtures";
import type { ChartFacts, DetectedSetup, Ohlcv } from "./types";
import { CLASSROOM_DISCLAIMER } from "./types";

export { CLASSROOM_DISCLAIMER, TEACHING_PATTERNS };
export type { TeachingPatternName, TeachingVariant };

export const HAMMER_PRIMARY_CHART_KEY = "classroom:hammer:RELIANCE:1D:primary";
export const TEACHING_SYMBOL = "RELIANCE";

export type LessonChart = {
  label: string;
  candles: Ohlcv[];
  facts: ChartFacts;
  setup: DetectedSetup;
};

export type ClassroomLesson = {
  chartKey: string;
  pattern: TeachingPatternName;
  symbol: string;
  timeframe: "1D";
  studentLevel: number;
  language: "en" | "hi" | "hinglish";
  isSynthetic: true;
  sessionDate: string;
  primary: LessonChart;
  weak: LessonChart;
  failed: LessonChart;
  disclaimer: string;
};

export type TeachingChartRef = {
  chartKey: string;
  pattern: TeachingPatternName;
  symbol: string;
  variant: TeachingVariant;
};

const SYNTHETIC_BASE_RATE = {
  universe: "synthetic-teaching-set",
  horizonBars: 5 as const,
  sampleSize: 80,
  hitRate: 0.46,
};

function chartKey(pattern: TeachingPatternName, variant: TeachingVariant | "primary"): string {
  return `classroom:${slugForPattern(pattern)}:${TEACHING_SYMBOL}:1D:${variant}`;
}

export function parseChartKey(key: string): TeachingChartRef | null {
  const match = /^classroom:([a-z0-9-]+):([A-Z0-9]+):1D:(primary|strong|weak|failed)$/.exec(key);
  if (!match) return null;
  const pattern = TEACHING_PATTERNS.find((name) => slugForPattern(name) === match[1]);
  if (!pattern || match[2] !== TEACHING_SYMBOL) return null;
  const variant: TeachingVariant = match[3] === "primary" ? "strong" : match[3];
  return { chartKey: key, pattern, symbol: TEACHING_SYMBOL, variant };
}

export function allTeachingChartKeys(): string[] {
  const keys: string[] = [HAMMER_PRIMARY_CHART_KEY];
  for (const name of TEACHING_PATTERNS) {
    for (const variant of ["strong", "weak", "failed"] as const) {
      keys.push(chartKey(name, variant));
    }
  }
  return keys;
}

function requireSetup(facts: ChartFacts, name: string, candles: Ohlcv[], label: string): LessonChart {
  const setup = facts.setups.find((s) => s.name === name);
  if (!setup) {
    throw new Error(
      `Classroom lesson "${label}" is missing a ${name} detection. Fix the fixture, do not invent a pattern.`,
    );
  }
  return { label, candles, facts, setup };
}

function analyze(candles: Ohlcv[], pattern: TeachingPatternName): ChartFacts {
  return analyzeChart({
    candles,
    symbol: TEACHING_SYMBOL,
    timeframe: "1D",
    isSynthetic: true,
    baseRates: { [pattern]: SYNTHETIC_BASE_RATE },
  });
}

export function buildClassroomLesson(
  chartKeyInput: string,
  opts: { studentLevel?: number; language?: "en" | "hi" | "hinglish"; now?: Date } = {},
): ClassroomLesson {
  const parsed = parseChartKey(chartKeyInput);
  if (!parsed) {
    throw new Error(`Unknown teaching chart: ${chartKeyInput}`);
  }

  const sessionDate = CLASSROOM_SESSION_DATE;
  const strongCandles = buildTeachingCandles(parsed.pattern, "strong", sessionDate);
  const weakCandles = buildTeachingCandles(parsed.pattern, "weak", sessionDate);
  const failedCandles = buildTeachingCandles(parsed.pattern, "failed", sessionDate);

  const lesson: ClassroomLesson = {
    chartKey: parsed.variant === "strong" && parsed.pattern === "Hammer" ? HAMMER_PRIMARY_CHART_KEY : chartKeyInput,
    pattern: parsed.pattern,
    symbol: TEACHING_SYMBOL,
    timeframe: "1D",
    studentLevel: opts.studentLevel ?? 2,
    language: opts.language ?? "en",
    isSynthetic: true,
    sessionDate,
    primary: requireSetup(analyze(strongCandles, parsed.pattern), parsed.pattern, strongCandles, "strong"),
    weak: requireSetup(analyze(weakCandles, parsed.pattern), parsed.pattern, weakCandles, "weak"),
    failed: requireSetup(analyze(failedCandles, parsed.pattern), parsed.pattern, failedCandles, "failed"),
    disclaimer: CLASSROOM_DISCLAIMER,
  };

  for (const chart of [lesson.primary, lesson.weak, lesson.failed]) {
    const last = lastBarSessionDate(chart.candles);
    if (!last) throw new Error(`Empty teaching tape for ${parsed.pattern} ${chart.label}`);
    assertEducationalLag(last, opts.now ?? new Date());
  }

  return lesson;
}

/** @deprecated Use buildClassroomLesson(HAMMER_PRIMARY_CHART_KEY). */
export function buildHammerClassroomLesson(
  studentLevel = 2,
  language: "en" | "hi" | "hinglish" = "en",
): ClassroomLesson {
  return buildClassroomLesson(HAMMER_PRIMARY_CHART_KEY, { studentLevel, language });
}

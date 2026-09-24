import { ATR_SIDEWAYS_MULT, REASONING_PASS_SCORE } from "@/config/education";
import { CLASSROOM_DISCLAIMER, type DetectedSetup, type ExpectedMove } from "@/lib/detection/types";
import { isSyntheticUniverse } from "@/lib/detection/baseRates";

export const MISTAKE_TAGS = [
  "wrong-direction",
  "followed-textbook-bias",
  "ignored-volume",
  "ignored-context",
  "certainty-language",
  "lucky-outcome",
  "good-process-bad-outcome",
] as const;

export type MistakeTag = (typeof MISTAKE_TAGS)[number];

export type OutcomeResult = "hit" | "miss" | "sideways-band" | "unavailable";

export type ScoredPrediction = {
  actual: ExpectedMove | null;
  closeReturnPct: number | null;
  /** Null when the 5-bar close or ATR band is not available — never treated as a miss. */
  matched: boolean | null;
  outcomeResult: OutcomeResult;
  reasoningScore: number;
  bandPct: number | null;
  tags: MistakeTag[];
};

export type ReasoningJudgeInput = {
  direction: ExpectedMove;
  reason: string;
  setup: DetectedSetup;
};

export type ReasoningJudge = (input: ReasoningJudgeInput) => { score: number; tags: MistakeTag[] };

const CERTAINTY = /\b(always|definitely|sure[- ]shot|guaranteed|will go)\b/i;
const CONTEXT_WORDS = /\b(trend|support|resistance|volume|ema|rsi|wick|invalidation)\b/i;
const VOLUME_WORDS = /\b(volume|vol)\b/i;
const INVALIDATION_WORDS = /\b(invalidation|stop[- ]?loss|stop)\b/i;
const SIZING_WORDS = /\b(size|sizing|shares|position|risk)\b/i;
const HEAVY_VOLUME = /\b(heavy|high volume|above average)\b/i;

export function atrBandPct(setup: DetectedSetup): number | null {
  const atr = setup.context.atr14;
  const close = setup.keyLevels.close;
  if (atr == null || close <= 0) return null;
  return (atr / close) * 100 * ATR_SIDEWAYS_MULT;
}

export function bucketByAtr(returnPct: number | null, bandPct: number | null): ExpectedMove | null {
  if (returnPct == null || bandPct == null) return null;
  if (Math.abs(returnPct) <= bandPct) return "sideways";
  return returnPct > 0 ? "up" : "down";
}

/** Keyword fallback. Swap this for an LLM judge later; keep the same return shape. */
export const keywordReasoningJudge: ReasoningJudge = (input) => {
  const tags: MistakeTag[] = [];
  let score = 0;
  const { reason, setup, direction } = input;
  const vol = setup.context.volumeVsAvg20;

  if (CONTEXT_WORDS.test(reason)) score += 30;
  else tags.push("ignored-context");

  if (VOLUME_WORDS.test(reason)) {
    score += 20;
    if (vol != null && vol < 1 && HEAVY_VOLUME.test(reason)) score -= 15;
  } else if (vol != null && vol < 1 && direction === setup.expectedMove) {
    tags.push("ignored-volume");
  }

  if (INVALIDATION_WORDS.test(reason)) score += 25;
  if (SIZING_WORDS.test(reason)) score += 25;

  if (CERTAINTY.test(reason)) {
    tags.push("certainty-language");
    score -= 30;
  }

  return { score: Math.max(0, Math.min(100, score)), tags };
};

export function scorePrediction(
  input: {
    direction: ExpectedMove;
    reason: string;
    setup: DetectedSetup;
  },
  judge: ReasoningJudge = keywordReasoningJudge,
): ScoredPrediction {
  const five = input.setup.forward.find((f) => f.bars === 5);
  const closeReturnPct = five?.closeReturnPct ?? null;
  const bandPct = atrBandPct(input.setup);
  const actual = bucketByAtr(closeReturnPct, bandPct);
  const judged = judge({ direction: input.direction, reason: input.reason, setup: input.setup });

  let outcomeResult: OutcomeResult = "unavailable";
  let matched: boolean | null = null;
  if (closeReturnPct == null || bandPct == null || actual == null) {
    outcomeResult = "unavailable";
  } else if (actual === "sideways" && input.direction === "sideways") {
    outcomeResult = "sideways-band";
    matched = true;
  } else if (actual === "sideways") {
    outcomeResult = "sideways-band";
    matched = false;
  } else {
    matched = actual === input.direction;
    outcomeResult = matched ? "hit" : "miss";
  }

  const tags: MistakeTag[] = [...judged.tags];
  const poor = judged.score < REASONING_PASS_SCORE;

  if (matched === true && poor) tags.push("lucky-outcome");
  if (outcomeResult === "miss" && !poor) tags.push("good-process-bad-outcome");
  if (outcomeResult === "miss" && poor) {
    tags.push("wrong-direction");
    if (input.direction === input.setup.expectedMove) tags.push("followed-textbook-bias");
    const vol = input.setup.context.volumeVsAvg20;
    if (vol != null && vol < 1 && input.direction === input.setup.expectedMove && !tags.includes("ignored-volume")) {
      tags.push("ignored-volume");
    }
  }

  return {
    actual,
    closeReturnPct,
    matched,
    outcomeResult,
    reasoningScore: judged.score,
    bandPct,
    tags: uniqueTags(tags),
  };
}

export type HabitInsight = {
  tag: MistakeTag;
  count: number;
  message: string;
};

const HABIT_COPY: Record<MistakeTag, (count: number) => string> = {
  "wrong-direction": (n) =>
    `${n} saved miss${n === 1 ? "" : "es"}: the 5-bar close did not match your direction. That is a record of one chart at a time, not a verdict on the pattern.`,
  "followed-textbook-bias": (n) =>
    `On ${n} chart${n === 1 ? "" : "s"} you followed the candle's textbook bias. The name is a label from the detection engine, not a forecast.`,
  "ignored-volume": (n) =>
    `On ${n} miss${n === 1 ? "" : "es"} volume was below its 20-bar average while you still took the textbook side. Light participation is a printed warning.`,
  "ignored-context": (n) =>
    `On ${n} note${n === 1 ? "" : "s"} the reason did not mention trend, volume, support, or another printed fact. Guess from what is on the chart.`,
  "certainty-language": (n) =>
    `On ${n} note${n === 1 ? "" : "s"} the reason used certainty language. Prefer “often” and past frequencies; never “always”.`,
  "lucky-outcome": (n) =>
    `On ${n} chart${n === 1 ? "" : "s"} the 5-bar close matched your direction, but the written reason was thin. Direction luck is not process.`,
  "good-process-bad-outcome": (n) =>
    `On ${n} chart${n === 1 ? "" : "s"} the 5-bar close disagreed, while the reason used printed context. That is not treated as a process failure.`,
};

const FAILURE_HABITS: ReadonlySet<MistakeTag> = new Set([
  "wrong-direction",
  "followed-textbook-bias",
  "ignored-volume",
  "ignored-context",
  "certainty-language",
  "lucky-outcome",
]);

/** Repeated-mistake notes. `good-process-bad-outcome` is listed but not treated as a failure. */
export function summarizeHabits(rows: Array<{ tags: string[] }>): HabitInsight[] {
  const counts = new Map<MistakeTag, number>();
  for (const row of rows) {
    for (const tag of row.tags) {
      if (!isMistakeTag(tag)) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return MISTAKE_TAGS.filter((tag) => (counts.get(tag) ?? 0) >= 2).map((tag) => ({
    tag,
    count: counts.get(tag) ?? 0,
    message: HABIT_COPY[tag](counts.get(tag) ?? 0),
  }));
}

export function isFailureHabit(tag: MistakeTag): boolean {
  return FAILURE_HABITS.has(tag);
}

export function shouldJournal(scored: ScoredPrediction): boolean {
  return scored.reasoningScore < REASONING_PASS_SCORE || scored.outcomeResult === "miss";
}

export function mistakeNarration(input: {
  setup: DetectedSetup;
  direction: ExpectedMove;
  reason: string;
  scored: ScoredPrediction;
  isSynthetic?: boolean;
}): string[] {
  const { setup, scored } = input;
  const fiveLine =
    scored.closeReturnPct == null || scored.actual == null
      ? "I don't have a 5-bar outcome for this snapshot."
      : `You guessed ${input.direction}. The close 5 bars later was ${scored.closeReturnPct.toFixed(2)}% (bucket: ${scored.actual}; ATR band ${scored.bandPct == null ? "I don't have that data" : `${scored.bandPct.toFixed(2)}%`}).`;

  const lines = [fiveLine];

  if (scored.tags.includes("lucky-outcome")) {
    lines.push("The direction matched this snapshot, but the written reason was thin. That is a lucky outcome, not proof of process.");
  }
  if (scored.tags.includes("good-process-bad-outcome")) {
    lines.push("The 5-bar close disagreed while the reason used printed facts. One path is an anecdote, not a process failure.");
  }
  if (scored.tags.includes("followed-textbook-bias")) {
    lines.push(
      `The engine labelled this a ${setup.name} (${setup.bias}, expected move ${setup.expectedMove}). That label is not a result.`,
    );
  }
  if (scored.tags.includes("ignored-volume")) {
    const vol = setup.context.volumeVsAvg20;
    lines.push(
      `Volume versus its 20-bar average was ${vol == null ? "I don't have that data" : `${vol.toFixed(2)}×`}.`,
    );
  }
  if (scored.tags.includes("ignored-context")) {
    lines.push(
      `Your line did not use a printed context fact (trend, volume, support, EMA, RSI). Use what is on the snapshot.`,
    );
  }
  if (scored.tags.includes("certainty-language")) {
    lines.push("Drop certainty wording. One path on one chart is an anecdote.");
  }

  lines.push(studentBaseRateLine(setup, input.isSynthetic ?? isSyntheticUniverse(setup.baseRate.universe)));
  lines.push(CLASSROOM_DISCLAIMER);
  return lines;
}

export function studentBaseRateLine(setup: DetectedSetup, isSynthetic: boolean): string {
  const { sampleSize, hitRate, universe } = setup.baseRate;
  if (isSynthetic || hitRate == null || sampleSize === 0 || isSyntheticUniverse(universe)) {
    return "I don't have a historical base rate for this snapshot.";
  }
  return `In the ${universe} set, ${Math.round(hitRate * 100)}% of ${sampleSize} ${setup.name} examples had a close 5 bars later in the textbook direction. Past frequency, not a forecast.`;
}

function uniqueTags(tags: MistakeTag[]): MistakeTag[] {
  return MISTAKE_TAGS.filter((tag) => tags.includes(tag));
}

function isMistakeTag(value: string): value is MistakeTag {
  return (MISTAKE_TAGS as readonly string[]).includes(value);
}

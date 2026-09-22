import { CLASSROOM_DISCLAIMER, type DetectedSetup, type ExpectedMove } from "@/lib/detection/types";
import { outcomeBucket } from "@/lib/detection/narrate";

export const MISTAKE_TAGS = [
  "wrong-direction",
  "followed-textbook-bias",
  "ignored-volume",
  "ignored-context",
  "certainty-language",
] as const;

export type MistakeTag = (typeof MISTAKE_TAGS)[number];

export type ScoredPrediction = {
  actual: ExpectedMove | null;
  closeReturnPct: number | null;
  /** Null when the 5-bar close is not available — never treated as a miss. */
  matched: boolean | null;
  tags: MistakeTag[];
};

const CERTAINTY = /\b(always|definitely|sure[- ]shot|guaranteed|will go)\b/i;
const CONTEXT_WORDS = /\b(trend|support|resistance|volume|ema|rsi|wick|invalidation)\b/i;

export function scorePrediction(input: {
  direction: ExpectedMove;
  reason: string;
  setup: DetectedSetup;
}): ScoredPrediction {
  const five = input.setup.forward.find((f) => f.bars === 5);
  const closeReturnPct = five?.closeReturnPct ?? null;
  const actual = outcomeBucket(closeReturnPct);
  const matched = actual == null ? null : actual === input.direction;
  const tags: MistakeTag[] = [];

  if (matched === false) {
    tags.push("wrong-direction");
    if (input.direction === input.setup.expectedMove) tags.push("followed-textbook-bias");
    const vol = input.setup.context.volumeVsAvg20;
    if (vol != null && vol < 1 && input.direction === input.setup.expectedMove) {
      tags.push("ignored-volume");
    }
    if (!CONTEXT_WORDS.test(input.reason)) tags.push("ignored-context");
    if (CERTAINTY.test(input.reason)) tags.push("certainty-language");
  }

  return { actual, closeReturnPct, matched, tags };
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
    `On ${n} miss${n === 1 ? "" : "es"} the reason did not mention trend, volume, support, or another printed fact. Guess from what is on the chart.`,
  "certainty-language": (n) =>
    `On ${n} miss${n === 1 ? "" : "es"} the reason used certainty language. Prefer “often” and past frequencies; never “always”.`,
};

/** Repeated-mistake notes. Only tags seen at least twice are surfaced as habits. */
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

export function mistakeNarration(input: {
  setup: DetectedSetup;
  direction: ExpectedMove;
  reason: string;
  scored: ScoredPrediction;
}): string[] {
  const { setup, scored } = input;
  const fiveLine =
    scored.closeReturnPct == null || scored.actual == null
      ? "I don't have a 5-bar outcome for this snapshot."
      : `You guessed ${input.direction}. The close 5 bars later was ${scored.closeReturnPct.toFixed(2)}% (bucket: ${scored.actual}).`;

  const lines = [fiveLine];

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

  const { sampleSize, hitRate, universe } = setup.baseRate;
  if (hitRate == null || sampleSize === 0) {
    lines.push("I don't have a historical base rate for this snapshot.");
  } else {
    lines.push(
      `In the ${universe} set, ${Math.round(hitRate * 100)}% of ${sampleSize} ${setup.name} examples had a close 5 bars later in the textbook direction. Past frequency, not a forecast.`,
    );
  }

  lines.push(CLASSROOM_DISCLAIMER);
  return lines;
}

function isMistakeTag(value: string): value is MistakeTag {
  return (MISTAKE_TAGS as readonly string[]).includes(value);
}

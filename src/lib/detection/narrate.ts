import {
  CLASSROOM_DISCLAIMER,
  type DetectedSetup,
  type ExpectedMove,
  type PatternContext,
} from "./types";

export const LAYERS = ["what", "why", "context", "predict", "reveal", "failure"] as const;
export type TutorLayer = (typeof LAYERS)[number];

export type TutorScript = {
  layer: TutorLayer;
  title: string;
  paragraphs: string[];
};

function rupee(value: number | null | undefined): string {
  if (value == null) return "I don't have that data";
  return `₹${value.toFixed(2)}`;
}

function num(value: number | null | undefined, digits = 2): string {
  if (value == null) return "I don't have that data";
  return value.toFixed(digits);
}

function trendPhrase(trend: PatternContext["priorTrend20"]): string {
  if (trend == null) return "I don't have a 20-bar trend reading";
  if (trend === "up") return "the prior 20 bars closed higher overall (uptrend)";
  if (trend === "down") return "the prior 20 bars closed lower overall (downtrend)";
  return "the prior 20 bars were sideways (inside a ±2% band)";
}

function missing(setup: DetectedSetup, extra: string[]): string[] {
  const gaps: string[] = [...extra];
  const c = setup.context;
  if (c.priorTrend20 == null) gaps.push("20-bar trend");
  if (c.volumeVsAvg20 == null) gaps.push("volume vs 20-bar average");
  if (c.ema20 == null) gaps.push("EMA(20)");
  if (c.rsi14 == null) gaps.push("RSI(14)");
  if (c.nearestSupport == null) gaps.push("nearest support");
  if (setup.baseRate.hitRate == null) gaps.push("historical base rate");
  if (gaps.length === 0) return [];
  return [`I don't have that data for: ${gaps.join(", ")}.`];
}

function baseRateLine(setup: DetectedSetup): string {
  const { sampleSize, hitRate, universe } = setup.baseRate;
  if (hitRate == null || sampleSize === 0) {
    return "I don't have a historical base rate for this pattern on this run.";
  }
  return `In the ${universe} set, ${Math.round(hitRate * 100)}% of ${sampleSize} ${setup.name} examples had a close 5 bars later in the textbook direction. That is a past frequency, not a forecast.`;
}

export function stopLossLine(invalidation: number, studentLevel: number): string {
  const level = rupee(invalidation);
  if (studentLevel >= 6) {
    return `Invalidation is ${level} — size the virtual position from that distance, not from a hoped-for target.`;
  }
  return `A stop-loss is a planned exit if price proves the idea wrong (full sizing math is Level 6). The engine's invalidation print is ${level}.`;
}

/**
 * Tutor copy built only from detection JSON. Never names a live trade.
 * StudentLevel only changes how stop-loss is introduced — not the numbers.
 */
export function narrateLayer(
  setup: DetectedSetup,
  layer: TutorLayer,
  opts: { studentLevel?: number; weak?: DetectedSetup; failedFiveBarPct?: number | null } = {},
): TutorScript {
  const studentLevel = opts.studentLevel ?? 2;
  const c = setup.context;
  const extraMissing = missing(setup, []);

  if (layer === "what") {
    return {
      layer,
      title: "What is on this chart",
      paragraphs: [
        `The highlighted candles are a ${setup.name}. In plain language: a small real body sitting near the high of the bar, with a long lower wick, after selling.`,
        `The pattern runs from bar ${setup.startIndex + 1} to bar ${setup.endIndex + 1}. Open ${rupee(setup.keyLevels.open)}, high ${rupee(setup.keyLevels.high)}, low ${rupee(setup.keyLevels.low)}, close ${rupee(setup.keyLevels.close)}.`,
        `Textbook bias is ${setup.bias} (expected move labelled ${setup.expectedMove}). That is a label from the detection engine, not a recommendation to trade.`,
        ...extraMissing,
        CLASSROOM_DISCLAIMER,
      ],
    };
  }

  if (layer === "why") {
    return {
      layer,
      title: "Why the shape looks that way",
      paragraphs: [
        `Sellers pushed price down toward ${rupee(setup.keyLevels.low)}, but buyers stepped in and the bar closed near ${rupee(setup.keyLevels.close)}, close to the high of ${rupee(setup.keyLevels.high)}.`,
        `The long lower wick is the footprint of that rejection on this bar only. The next closed bar decides whether that shift held.`,
        `Volume versus its 20-bar average is ${num(c.volumeVsAvg20, 2)}${c.volumeVsAvg20 == null ? "" : "×"}.`,
        ...extraMissing,
        CLASSROOM_DISCLAIMER,
      ],
    };
  }

  if (layer === "context") {
    const weak = opts.weak;
    const weakLines = weak
      ? [
          `Strong-looking twin on this chart: ${trendPhrase(c.priorTrend20)}; volume ${num(c.volumeVsAvg20, 2)}× the 20-bar average; nearest support ${rupee(c.nearestSupport)} (${num(c.distanceToSupportPct, 2)}% away).`,
          `Weaker twin: ${trendPhrase(weak.context.priorTrend20)}; volume ${num(weak.context.volumeVsAvg20, 2)}×; nearest support ${rupee(weak.context.nearestSupport)}. Same candle name, different location.`,
        ]
      : [`${trendPhrase(c.priorTrend20)}. Close vs EMA(20): ${c.closeVsEma20 ?? "I don't have that data"}. RSI(14): ${num(c.rsi14, 1)}.`];
    return {
      layer,
      title: "Same name, different neighbourhood",
      paragraphs: [
        ...weakLines,
        `A hammer in a downtrend near support with heavy volume is a different study case than the same wick in a quiet range. The engine does not upgrade the weak one just because the drawing looks similar.`,
        ...extraMissing,
        CLASSROOM_DISCLAIMER,
      ],
    };
  }

  if (layer === "predict") {
    return {
      layer,
      title: "Predict before you see the next bars",
      paragraphs: [
        "Candles after the pattern are hidden. Choose up, down, or sideways, a confidence from 50–100%, and one sentence on why — using only facts already on screen.",
        "You cannot skip this step. One guess does not prove the pattern works or fails.",
        CLASSROOM_DISCLAIMER,
      ],
    };
  }

  if (layer === "reveal") {
    const five = setup.forward.find((f) => f.bars === 5);
    const outcome =
      five?.closeReturnPct == null
        ? "I don't have a 5-bar outcome because those candles are not closed."
        : `The close 5 bars later was ${five.closeReturnPct.toFixed(2)}% from the pattern close. Textbook-direction hit: ${five.hitExpected ? "yes" : "no"}.`;
    return {
      layer,
      title: "What the next bars actually did",
      paragraphs: [
        outcome,
        baseRateLine(setup),
        "One path on one chart is an anecdote. It does not prove the pattern generally works or fails.",
        ...extraMissing,
        CLASSROOM_DISCLAIMER,
      ],
    };
  }

  const failedPct = opts.failedFiveBarPct;
  const failedLine =
    failedPct == null
      ? "I don't have a 5-bar outcome on the failure example."
      : `On the failure example, the close 5 bars later was ${failedPct.toFixed(2)}% from that hammer's close.`;

  return {
    layer: "failure",
    title: "When the same pattern failed",
    paragraphs: [
      failedLine,
      `Warning signs to study: if volume is light, trend is not clearly down, or price is far from support, the wick is easier to fade. Use the printed context — do not invent extra reasons.`,
      stopLossLine(setup.keyLevels.invalidation, studentLevel),
      "This is a virtual-money classroom. No live stock is being recommended.",
      CLASSROOM_DISCLAIMER,
    ],
  };
}

export function outcomeBucket(returnPct: number | null): ExpectedMove | null {
  if (returnPct == null) return null;
  if (returnPct > 0.5) return "up";
  if (returnPct < -0.5) return "down";
  return "sideways";
}

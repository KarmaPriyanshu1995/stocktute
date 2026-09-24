import { LAG_DAYS } from "@/config/education";
import { narrateLayer } from "@/lib/detection/narrate";
import type { ChartFacts, DetectedSetup, Ohlcv } from "@/lib/detection/types";
import { DISCLAIMER } from "./compliance";
import { virtualPositionSize } from "./positionSize";
import { snapshot, type PickedSetup } from "./select";
import type { SectionId } from "./universe";

export type QuizItem = {
  id: string;
  type: "mcq" | "chart-mark" | "explain";
  prompt: string;
  options?: string[];
  answer: string;
};

export type BuiltSection = {
  id: SectionId;
  minLevel: number;
  title: string;
  paragraphs: string[];
  chart?: {
    symbol: string;
    timeframe: "1D";
    candles: Ohlcv[];
    setup: DetectedSetup;
    hideAfterPattern: boolean;
    isSynthetic: boolean;
  };
  charts?: Array<{
    symbol: string;
    candles: Ohlcv[];
    setup: DetectedSetup;
    label: string;
    isSynthetic: boolean;
  }>;
  quiz?: QuizItem[];
  extras?: Record<string, string | number | null>;
};

function rupee(value: number | null | undefined): string {
  if (value == null) return "I don't have that data";
  return `₹${value.toFixed(2)}`;
}

function lastBar(candles: Ohlcv[]): Ohlcv | null {
  return candles[candles.length - 1] ?? null;
}

function pct(curr: number, prev: number): string {
  return `${(((curr - prev) / prev) * 100).toFixed(2)}%`;
}

export function marketStory(date: string, nifty: ChartFacts & { candles: Ohlcv[] }, bank: ChartFacts & { candles: Ohlcv[] }): string[] {
  const nLast = lastBar(nifty.candles);
  const nPrev = nifty.candles[nifty.candles.length - 2];
  const bLast = lastBar(bank.candles);
  const bPrev = bank.candles[bank.candles.length - 2];
  if (!nLast || !bLast) {
    return ["I don't have that data for the index session.", DISCLAIMER];
  }
  const nChange = nPrev ? pct(nLast.close, nPrev.close) : "I don't have that data";
  const bChange = bPrev ? pct(bLast.close, bPrev.close) : "I don't have that data";
  const nVol = nifty.volumeAvg20 == null || nLast.volume === 0
    ? "I don't have that data"
    : `${(nLast.volume / nifty.volumeAvg20).toFixed(2)}×`;
  return [
    `Closed session from ${date}, shown after the ${LAG_DAYS}-day educational delay. Not today's market.`,
    `On ${date} (closed session), NIFTY printed open ${rupee(nLast.open)}, high ${rupee(nLast.high)}, low ${rupee(nLast.low)}, close ${rupee(nLast.close)}. Change vs the prior close: ${nChange}. Volume vs its 20-bar average: ${nVol}.`,
    `BANK NIFTY closed at ${rupee(bLast.close)} (range ${rupee(bLast.low)}–${rupee(bLast.high)}). Change vs the prior close: ${bChange}.`,
    "Only price and volume are described. No news, flows, or reasons are invented.",
    DISCLAIMER,
  ];
}

export function patternOfDayCopy(pick: PickedSetup): string[] {
  const what = narrateLayer(pick.setup, "what");
  const why = narrateLayer(pick.setup, "why");
  return [
    `${pick.symbol} daily. The detection engine labelled a ${pick.setup.name}.`,
    ...what.paragraphs.slice(0, 2),
    ...why.paragraphs.slice(0, 2),
    DISCLAIMER,
  ];
}

export function trapCopy(pick: PickedSetup | null, twinName: string | null): string[] {
  if (!pick) {
    return ["I don't have a trap example on this run. The engine did not print a weak-context twin.", DISCLAIMER];
  }
  const vol = pick.setup.context.volumeVsAvg20;
  const trend = pick.setup.context.priorTrend20;
  return [
    `${pick.symbol} also printed a ${pick.setup.name}${twinName ? ` — the same name as the ${twinName} example` : ""}.`,
    `Printed context: prior 20-bar trend ${trend ?? "I don't have that data"}; volume vs 20-bar average ${vol == null ? "I don't have that data" : `${vol.toFixed(2)}×`}; nearest support ${rupee(pick.setup.context.nearestSupport)}.`,
    "The drawing looks similar. The neighbourhood is weaker, so this is a study in what not to treat as a clean example.",
    DISCLAIMER,
  ];
}

export function predictCopy(pick: PickedSetup, sessionDate: string): string[] {
  return [
    `Closed session from ${sessionDate}, shown after the ${LAG_DAYS}-day educational delay. ${pick.symbol} daily. Candles after the pattern stay hidden until you lock a prediction. The last bar on this tape is already closed — this is not a live tip.`,
    `The engine labelled a ${pick.setup.name} ending at bar ${pick.setup.endIndex + 1}. Textbook bias is ${pick.setup.bias}. That is a label, not a forecast.`,
    DISCLAIMER,
  ];
}

export function riskDrillCopy(pick: PickedSetup | null): { paragraphs: string[]; extras: Record<string, string | number | null> } {
  if (!pick) {
    return {
      paragraphs: ["I don't have an invalidation print for a risk drill today.", DISCLAIMER],
      extras: { shares: null, entry: null, invalidation: null },
    };
  }
  const entry = pick.setup.keyLevels.close;
  const invalidation = pick.setup.keyLevels.invalidation;
  const sized = virtualPositionSize({ capital: 100_000, riskPct: 1, entry, invalidation });
  if ("error" in sized) {
    return { paragraphs: [sized.error, DISCLAIMER], extras: { shares: null, entry, invalidation } };
  }
  return {
    extras: {
      shares: sized.shares,
      entry,
      invalidation,
      rupeeRisk: sized.rupeeRisk,
      perShare: sized.perShare,
      side: sized.side,
    },
    paragraphs: [
      `Hypothetical virtual account ₹1,00,000, 1% planned risk (₹1,000). Study symbol ${pick.symbol}.`,
      `Entry print (pattern close) ${rupee(entry)}. Invalidation ${rupee(invalidation)}. Distance per share ${rupee(sized.perShare)}.`,
      `Classroom size = floor(₹1,000 ÷ ${rupee(sized.perShare)}) = ${sized.shares} shares (${sized.side}). Notional ₹${sized.notional.toLocaleString("en-IN")}.`,
      "This is a sizing drill on a closed chart. It is not a recommendation to take a live position.",
      DISCLAIMER,
    ],
  };
}

export function ruleCheckCopy(tapes: Array<{ symbol: string; facts: ChartFacts; candles: Ohlcv[] }>, sessionDate: string): string[] {
  const matched: string[] = [];
  for (const tape of tapes) {
    if (tape.symbol === "NIFTY" || tape.symbol === "BANKNIFTY") continue;
    const last = lastBar(tape.candles);
    if (!last || tape.facts.ema20 == null || tape.facts.volumeAvg20 == null) continue;
    const above = last.close > tape.facts.ema20;
    const heavy = last.volume > tape.facts.volumeAvg20 * 1.5;
    if (above && heavy) matched.push(tape.symbol);
  }
  return [
    `Study rule (educational only) on the closed lagged session ${sessionDate}: last close above EMA(20) and session volume greater than 1.5× the 20-bar average.`,
    matched.length === 0
      ? "No constituent in this synthetic universe matched the rule on the closed session."
      : `Symbols that matched: ${matched.join(", ")}.`,
    "Matching a classroom rule is not an order. Virtual money only.",
    DISCLAIMER,
  ];
}

export function quizFrom(pick: PickedSetup | null): QuizItem[] {
  if (!pick) {
    return [
      {
        id: "q1",
        type: "explain",
        prompt: "I don't have a pattern snapshot for a quiz on this run.",
        answer: "I don't have that data",
      },
    ];
  }
  const trend = pick.setup.context.priorTrend20 ?? "I don't have that data";
  const vol = pick.setup.context.volumeVsAvg20;
  return [
    {
      id: "q1",
      type: "mcq",
      prompt: `What did the engine label on ${pick.symbol}?`,
      options: [pick.setup.name, "Doji", "Marubozu", "Gap"],
      answer: pick.setup.name,
    },
    {
      id: "q2",
      type: "mcq",
      prompt: `Prior 20-bar trend on the ${pick.symbol} snapshot?`,
      options: ["up", "down", "sideways", "I don't have that data"],
      answer: String(trend),
    },
    {
      id: "q3",
      type: "mcq",
      prompt: "Volume vs 20-bar average was…",
      options: ["below 1×", "at least 1×", "I don't have that data"],
      answer: vol == null ? "I don't have that data" : vol >= 1 ? "at least 1×" : "below 1×",
    },
    {
      id: "q4",
      type: "chart-mark",
      prompt: `On the ${pick.symbol} chart, mark the pattern bars (${pick.setup.startIndex + 1}–${pick.setup.endIndex + 1} on the snapshot).`,
      answer: `${pick.setup.startIndex}-${pick.setup.endIndex}`,
    },
    {
      id: "q5",
      type: "explain",
      prompt: "In one sentence, which printed fact made this a stronger or weaker study case? Do not name a live trade.",
      answer: `Trend ${trend}; volume ${vol == null ? "unavailable" : `${vol.toFixed(2)}×`}.`,
    },
  ];
}

export function chartPayload(pick: PickedSetup, hideAfterPattern: boolean) {
  const snap = snapshot(pick);
  return {
    symbol: pick.symbol,
    timeframe: "1D" as const,
    candles: snap.candles,
    setup: snap.setup,
    hideAfterPattern,
    isSynthetic: pick.facts.isSynthetic,
  };
}

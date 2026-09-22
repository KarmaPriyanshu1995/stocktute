import { analyzeChart } from "@/lib/detection/engine";
import { tallyBaseRates } from "@/lib/detection/baseRates";
import type { ChartFacts, Ohlcv } from "@/lib/detection/types";
import { skipReason } from "./calendar";
import { DISCLAIMER, filterParagraphs, type ComplianceHit } from "./compliance";
import {
  chartPayload,
  marketStory,
  patternOfDayCopy,
  predictCopy,
  quizFrom,
  riskDrillCopy,
  ruleCheckCopy,
  trapCopy,
  type BuiltSection,
} from "./copy";
import { pickTeachingSetups, type AnalyzedTape } from "./select";
import { buildUniverseTapes } from "./tapes";
import { SECTION_META } from "./universe";

export type BuiltChapter = {
  date: string;
  status: "draft";
  disclaimer: string;
  source: "synthetic-eod";
  sections: BuiltSection[];
  compliance: { blockedCount: number; hits: ComplianceHit[] };
};

export type GenerateResult =
  | { ok: true; chapter: BuiltChapter }
  | { ok: false; skipped: "weekend" | "holiday" };

function analyzeTapes(date: string): AnalyzedTape[] {
  const tapes = buildUniverseTapes(date);
  const first = tapes.map((tape) => ({
    ...tape,
    facts: analyzeChart({ candles: tape.candles, symbol: tape.symbol, timeframe: "1D" }),
  }));
  const table = tallyBaseRates(
    first.flatMap((t) => t.facts.setups),
    "synthetic-eod-80d",
  );
  return tapes.map((tape) => ({
    ...tape,
    facts: analyzeChart({
      candles: tape.candles,
      symbol: tape.symbol,
      timeframe: "1D",
      baseRates: table,
    }),
  }));
}

function indexView(tapes: AnalyzedTape[], symbol: string): ChartFacts & { candles: Ohlcv[] } {
  const tape = tapes.find((t) => t.symbol === symbol);
  if (!tape) {
    return {
      symbol,
      timeframe: "1D",
      barCount: 0,
      lastClose: 0,
      ema20: null,
      ema50: null,
      rsi14: null,
      volumeAvg20: null,
      supportLevels: [],
      resistanceLevels: [],
      setups: [],
      missingFacts: ["I don't have that data"],
      candles: [],
    };
  }
  return { ...tape.facts, candles: tape.candles };
}

export function generateDailyChapter(date: string): GenerateResult {
  const skipped = skipReason(date);
  if (skipped) return { ok: false, skipped };

  const tapes = analyzeTapes(date);
  const picks = pickTeachingSetups(tapes);
  const hits: ComplianceHit[] = [];
  const risk = riskDrillCopy(picks.patternOfDay);

  const raw: BuiltSection[] = [
    {
      ...SECTION_META[0],
      paragraphs: marketStory(date, indexView(tapes, "NIFTY"), indexView(tapes, "BANKNIFTY")),
    },
    {
      ...SECTION_META[1],
      paragraphs: picks.patternOfDay
        ? patternOfDayCopy(picks.patternOfDay)
        : ["I don't have a clean pattern of the day on this run.", DISCLAIMER],
      chart: picks.patternOfDay ? chartPayload(picks.patternOfDay, false) : undefined,
    },
    {
      ...SECTION_META[2],
      paragraphs: picks.predict
        ? predictCopy(picks.predict)
        : ["I don't have a closed yesterday-bar for predict-and-reveal.", DISCLAIMER],
      chart: picks.predict ? chartPayload(picks.predict, true) : undefined,
    },
    {
      ...SECTION_META[3],
      paragraphs: [
        "Three closed charts. Name the pattern on each from the drawing — then check the engine label in review.",
        DISCLAIMER,
      ],
      charts: picks.spotIt.map((p, i) => ({
        symbol: p.symbol,
        ...chartPayload(p, false),
        label: `Chart ${i + 1}`,
      })),
    },
    {
      ...SECTION_META[4],
      paragraphs: trapCopy(picks.trap, picks.patternOfDay?.setup.name ?? null),
      chart: picks.trap ? chartPayload(picks.trap, false) : undefined,
    },
    {
      ...SECTION_META[5],
      paragraphs: risk.paragraphs,
      extras: risk.extras,
      chart: picks.patternOfDay ? chartPayload(picks.patternOfDay, false) : undefined,
    },
    {
      ...SECTION_META[6],
      paragraphs: ruleCheckCopy(tapes),
    },
    {
      ...SECTION_META[7],
      paragraphs: ["Five questions from today's engine snapshots. One outcome does not prove a pattern.", DISCLAIMER],
      quiz: quizFrom(picks.patternOfDay),
    },
  ];

  const sections = raw.map((s) => {
    const body = filterParagraphs(s.paragraphs);
    hits.push(...body.hits);
    const quiz = s.quiz?.map((q) => {
      const p = filterParagraphs([q.prompt]);
      hits.push(...p.hits);
      return { ...q, prompt: p.paragraphs[0] ?? q.prompt };
    });
    return { ...s, paragraphs: body.paragraphs, quiz };
  });

  return {
    ok: true,
    chapter: {
      date,
      status: "draft",
      disclaimer: DISCLAIMER,
      source: "synthetic-eod",
      sections,
      compliance: { blockedCount: hits.length, hits },
    },
  };
}

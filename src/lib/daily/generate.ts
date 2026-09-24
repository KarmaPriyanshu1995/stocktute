import { analyzeChart } from "@/lib/detection/engine";
import { tallyBaseRates } from "@/lib/detection/baseRates";
import type { ChartFacts, Ohlcv } from "@/lib/detection/types";
import { skipReason } from "./calendar";
import { DISCLAIMER, filterParagraphs, unresolvedFlagCount, type ComplianceFlag } from "./compliance";
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
import { assertEducationalLag, istNoon, laggedTradingSession } from "@/lib/compliance/dataLag";

export type BuiltChapter = {
  date: string;
  sessionDate: string;
  status: "draft";
  disclaimer: string;
  source: "synthetic-eod";
  isSynthetic: true;
  sections: BuiltSection[];
  compliance: { blockedCount: number; flags: ComplianceFlag[]; hits: ComplianceFlag[] };
};

export type GenerateResult =
  | { ok: true; chapter: BuiltChapter }
  | { ok: false; skipped: "weekend" | "holiday" };

function analyzeTapes(sessionDate: string): AnalyzedTape[] {
  const tapes = buildUniverseTapes(sessionDate);
  const first = tapes.map((tape) => ({
    ...tape,
    facts: analyzeChart({
      candles: tape.candles,
      symbol: tape.symbol,
      timeframe: "1D",
      isSynthetic: true,
    }),
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
      isSynthetic: true,
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
      atr14: null,
      volumeAvg20: null,
      supportLevels: [],
      resistanceLevels: [],
      setups: [],
      missingFacts: ["I don't have that data"],
      isSynthetic: true,
      candles: [],
    };
  }
  return { ...tape.facts, candles: tape.candles };
}

/**
 * `date` is the run / as-of day. The tape is the last NSE session at least
 * 30 calendar days earlier.
 */
export function generateDailyChapter(date: string): GenerateResult {
  const skipped = skipReason(date);
  if (skipped) return { ok: false, skipped };

  const sessionDate = laggedTradingSession(date);
  assertEducationalLag(sessionDate, istNoon(date));

  const tapes = analyzeTapes(sessionDate);
  const picks = pickTeachingSetups(tapes);
  const flags: ComplianceFlag[] = [];
  const risk = riskDrillCopy(picks.patternOfDay);

  const raw: BuiltSection[] = [
    {
      ...SECTION_META[0],
      paragraphs: marketStory(sessionDate, indexView(tapes, "NIFTY"), indexView(tapes, "BANKNIFTY")),
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
        ? predictCopy(picks.predict, sessionDate)
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
      paragraphs: ruleCheckCopy(tapes, sessionDate),
    },
    {
      ...SECTION_META[7],
      paragraphs: ["Five questions from today's engine snapshots. One outcome does not prove a pattern.", DISCLAIMER],
      quiz: quizFrom(picks.patternOfDay),
    },
  ];

  const sections = raw.map((s) => {
    const body = filterParagraphs(s.paragraphs);
    flags.push(...body.flags);
    const quiz = s.quiz?.map((q) => {
      const p = filterParagraphs([q.prompt]);
      flags.push(...p.flags);
      return { ...q, prompt: p.paragraphs[0] ?? q.prompt };
    });
    return { ...s, paragraphs: body.paragraphs, quiz };
  });

  const blockedCount = unresolvedFlagCount(flags);

  return {
    ok: true,
    chapter: {
      date,
      sessionDate,
      status: "draft",
      disclaimer: DISCLAIMER,
      source: "synthetic-eod",
      isSynthetic: true,
      sections,
      compliance: { blockedCount, flags, hits: flags },
    },
  };
}

export function chapterPublishStatus(
  chapter: Pick<BuiltChapter, "isSynthetic" | "compliance">,
  autoPublish: boolean,
): "published" | "draft" {
  if (!autoPublish) return "draft";
  if (chapter.isSynthetic) return "draft";
  if (unresolvedFlagCount(chapter.compliance.flags) > 0) return "draft";
  return "published";
}

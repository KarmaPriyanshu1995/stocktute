import type { ChartFacts, DetectedSetup, Ohlcv } from "@/lib/detection/types";

export type AnalyzedTape = {
  symbol: string;
  candles: Ohlcv[];
  facts: ChartFacts;
};

export type PickedSetup = {
  symbol: string;
  candles: Ohlcv[];
  facts: ChartFacts;
  setup: DetectedSetup;
};

function recent(setup: DetectedSetup, barCount: number): boolean {
  return setup.endIndex >= barCount - 15 && setup.endIndex <= barCount - 2;
}

function isTrap(setup: DetectedSetup): boolean {
  const vol = setup.context.volumeVsAvg20;
  const farSupport = (setup.context.distanceToSupportPct ?? 0) > 4;
  const farRes = (setup.context.distanceToResistancePct ?? 0) > 4;
  const light = vol != null && vol < 1;
  return light || (farSupport && farRes);
}

function quality(setup: DetectedSetup): number {
  let score = 0;
  if (setup.confirmation === "confirmed") score += 3;
  if ((setup.context.volumeVsAvg20 ?? 0) >= 1.2) score += 2;
  if (setup.context.priorTrend20 === "down" && setup.bias === "bullish") score += 2;
  if (setup.context.priorTrend20 === "up" && setup.bias === "bearish") score += 2;
  if ((setup.context.distanceToSupportPct ?? 99) < 2 && setup.bias === "bullish") score += 2;
  if (setup.name !== "Doji") score += 1;
  if (!isTrap(setup)) score += 2;
  return score;
}

function flatten(tapes: AnalyzedTape[]): PickedSetup[] {
  const out: PickedSetup[] = [];
  for (const tape of tapes) {
    for (const setup of tape.facts.setups) {
      if (!recent(setup, tape.candles.length)) continue;
      out.push({ symbol: tape.symbol, candles: tape.candles, facts: tape.facts, setup });
    }
  }
  return out;
}

export type ChapterPicks = {
  patternOfDay: PickedSetup | null;
  trap: PickedSetup | null;
  predict: PickedSetup | null;
  spotIt: PickedSetup[];
};

export function pickTeachingSetups(tapes: AnalyzedTape[]): ChapterPicks {
  const all = flatten(tapes).sort((a, b) => quality(b.setup) - quality(a.setup));
  const clean = all.filter((p) => !isTrap(p.setup));
  const traps = all.filter((p) => isTrap(p.setup));

  const patternOfDay = clean[0] ?? all[0] ?? null;
  const trap =
    traps.find((p) => p.symbol !== patternOfDay?.symbol && p.setup.name === patternOfDay?.setup.name) ??
    traps.find((p) => p.symbol !== patternOfDay?.symbol) ??
    traps[0] ??
    null;

  const predict =
    all.find((p) => p.setup.endIndex === p.candles.length - 2) ??
    patternOfDay;

  const used = new Set([patternOfDay?.symbol, trap?.symbol].filter(Boolean));
  const spotIt: PickedSetup[] = [];
  const biases = new Set<string>();
  for (const p of all) {
    if (spotIt.length >= 3) break;
    if (used.has(p.symbol)) continue;
    if (biases.has(p.setup.bias) && spotIt.length < 2) continue;
    spotIt.push(p);
    used.add(p.symbol);
    biases.add(p.setup.bias);
  }
  for (const p of all) {
    if (spotIt.length >= 3) break;
    if (spotIt.some((s) => s.symbol === p.symbol && s.setup.id === p.setup.id)) continue;
    if (used.has(p.symbol) && spotIt.length > 0) continue;
    spotIt.push(p);
    used.add(p.symbol);
  }

  return { patternOfDay, trap, predict, spotIt: spotIt.slice(0, 3) };
}

export function snapshot(pick: PickedSetup): { candles: Ohlcv[]; setup: DetectedSetup } {
  const from = Math.max(0, pick.setup.startIndex - 25);
  const to = Math.min(pick.candles.length, pick.setup.endIndex + 11);
  const slice = pick.candles.slice(from, to);
  const shift = from;
  return {
    candles: slice,
    setup: {
      ...pick.setup,
      startIndex: pick.setup.startIndex - shift,
      endIndex: pick.setup.endIndex - shift,
    },
  };
}

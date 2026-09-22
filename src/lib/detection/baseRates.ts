import type { BaseRate, DetectedSetup } from "./types";

export const EMPTY_BASE_RATE = (): BaseRate => ({
  universe: "unavailable",
  horizonBars: 5,
  sampleSize: 0,
  hitRate: null,
});

/**
 * Tally how often a pattern's 5-bar close moved in the expected direction.
 * Call this on a labelled historical universe (e.g. NIFTY 50 daily, 5y) and
 * pass the table into `analyzeChart`. No universe → sampleSize 0.
 */
export function tallyBaseRates(
  setups: Pick<DetectedSetup, "name" | "forward">[],
  universe: string,
): Record<string, BaseRate> {
  const buckets = new Map<string, { hits: number; n: number }>();

  for (const setup of setups) {
    const five = setup.forward.find((f) => f.bars === 5);
    if (!five || five.hitExpected == null) continue;
    const bucket = buckets.get(setup.name) ?? { hits: 0, n: 0 };
    bucket.n += 1;
    if (five.hitExpected) bucket.hits += 1;
    buckets.set(setup.name, bucket);
  }

  const table: Record<string, BaseRate> = {};
  for (const [name, { hits, n }] of buckets) {
    table[name] = {
      universe,
      horizonBars: 5,
      sampleSize: n,
      hitRate: n === 0 ? null : hits / n,
    };
  }
  return table;
}

export function lookupBaseRate(
  table: Partial<Record<string, BaseRate>> | undefined,
  name: string,
): BaseRate {
  return table?.[name] ?? EMPTY_BASE_RATE();
}

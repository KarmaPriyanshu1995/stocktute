import { LAG_DAYS } from "@/config/education";
import { addDays, formatIstDate, isNseTradingDay, parseIsoDate } from "@/lib/daily/calendar";
import type { Ohlcv } from "@/lib/detection/types";

export class EducationalLagError extends Error {
  readonly code = "educational_lag" as const;
  constructor(
    readonly sessionDate: string,
    readonly asOfDate: string,
    readonly lagDays = LAG_DAYS,
  ) {
    super(
      `Session ${sessionDate} is too recent for teaching (need ${lagDays} calendar days before ${asOfDate}).`,
    );
    this.name = "EducationalLagError";
  }
}

export function istDateOf(at: Date): string {
  return formatIstDate(at);
}

/** Noon IST for an ISO calendar date — use as `now` when the as-of day is a run date. */
export function istNoon(date: string): Date {
  const [y, m, d] = parseIsoDate(date);
  return new Date(Date.UTC(y, m - 1, d, 6, 30));
}

export function calendarDaysBetween(earlier: string, later: string): number {
  const [y1, m1, d1] = parseIsoDate(earlier);
  const [y2, m2, d2] = parseIsoDate(later);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Named-security teaching content must be at least LAG_DAYS old (IST calendar).
 * 29 days → reject; 30+ → pass.
 */
export function assertEducationalLag(sessionDate: string, now: Date = new Date()): void {
  const asOf = istDateOf(now);
  const age = calendarDaysBetween(sessionDate, asOf);
  if (age < LAG_DAYS) {
    throw new EducationalLagError(sessionDate, asOf);
  }
}

export function isLaggedSession(sessionDate: string, now: Date = new Date()): boolean {
  try {
    assertEducationalLag(sessionDate, now);
    return true;
  } catch {
    return false;
  }
}

/** Most recent NSE trading day that is still ≥ LAG_DAYS before `asOfDate`. */
export function laggedTradingSession(asOfDate: string): string {
  let cursor = addDays(asOfDate, -LAG_DAYS);
  for (let i = 0; i < 21; i++) {
    if (isNseTradingDay(cursor)) return cursor;
    cursor = addDays(cursor, -1);
  }
  return cursor;
}

export function lagCutoffUnix(now: Date = new Date()): number {
  const session = laggedTradingSession(istDateOf(now));
  const [y, m, d] = parseIsoDate(session);
  return Math.floor(Date.UTC(y, m - 1, d, 10, 0, 0) / 1000);
}

export function clampCandlesToLag<T extends { time: number }>(candles: T[], now: Date = new Date()): T[] {
  const cutoff = lagCutoffUnix(now);
  return candles.filter((c) => c.time <= cutoff);
}

export function lastBarSessionDate(candles: Ohlcv[]): string | null {
  const last = candles[candles.length - 1];
  if (!last) return null;
  return formatIstDate(new Date(last.time * 1000));
}

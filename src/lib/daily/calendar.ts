const IST = "Asia/Kolkata";

/** YYYY-MM-DD in Asia/Kolkata. */
export function formatIstDate(at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** 15:30 IST session close as unix seconds (UTC 10:00). India has no DST. */
export function sessionCloseUnix(date: string): number {
  const [y, m, d] = parseIsoDate(date);
  return Math.floor(Date.UTC(y, m - 1, d, 10, 0, 0) / 1000);
}

export function parseIsoDate(date: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid ISO date: ${date}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function noonIstUtc(date: string): Date {
  const [y, m, d] = parseIsoDate(date);
  return new Date(Date.UTC(y, m - 1, d, 6, 30));
}

export function weekdayIst(date: string): number {
  return noonIstUtc(date).getUTCDay();
}

/**
 * Closed NSE cash-market holidays. Not a substitute for the official circular —
 * replace this list when a licensed calendar is wired.
 */
export const NSE_HOLIDAYS = new Set([
  "2025-01-26",
  "2025-02-26",
  "2025-03-14",
  "2025-03-31",
  "2025-04-10",
  "2025-04-14",
  "2025-04-18",
  "2025-05-01",
  "2025-08-15",
  "2025-08-27",
  "2025-10-02",
  "2025-10-21",
  "2025-10-22",
  "2025-11-05",
  "2025-12-25",
  "2026-01-26",
  "2026-03-03",
  "2026-03-31",
  "2026-04-03",
  "2026-04-14",
  "2026-05-01",
  "2026-08-15",
  "2026-10-02",
  "2026-11-12",
  "2026-12-25",
]);

export function isWeekend(date: string): boolean {
  const day = weekdayIst(date);
  return day === 0 || day === 6;
}

export function isNseHoliday(date: string): boolean {
  return NSE_HOLIDAYS.has(date);
}

export function isNseTradingDay(date: string): boolean {
  return !isWeekend(date) && !isNseHoliday(date);
}

export function skipReason(date: string): "weekend" | "holiday" | null {
  if (isWeekend(date)) return "weekend";
  if (isNseHoliday(date)) return "holiday";
  return null;
}

export function addDays(date: string, delta: number): string {
  const utc = noonIstUtc(date);
  utc.setUTCDate(utc.getUTCDate() + delta);
  return formatIstDate(utc);
}

export function previousTradingDay(date: string): string {
  let cursor = addDays(date, -1);
  for (let i = 0; i < 14; i++) {
    if (isNseTradingDay(cursor)) return cursor;
    cursor = addDays(cursor, -1);
  }
  return cursor;
}

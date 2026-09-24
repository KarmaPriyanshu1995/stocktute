import { isListedNseHoliday } from "./holidays";

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

export function isWeekend(date: string): boolean {
  const day = weekdayIst(date);
  return day === 0 || day === 6;
}

export function isNseHoliday(date: string): boolean {
  return isListedNseHoliday(date);
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

import holidays2025 from "@/config/nse-holidays/2025.json";
import holidays2026 from "@/config/nse-holidays/2026.json";

/** TODO-VERIFY: replace with the official NSE circular each year. */
const BY_YEAR: Record<number, string[]> = {
  2025: holidays2025,
  2026: holidays2026,
};

export function nseHolidaysForYear(year: number): ReadonlySet<string> {
  return new Set(BY_YEAR[year] ?? []);
}

export function isListedNseHoliday(date: string): boolean {
  const year = Number(date.slice(0, 4));
  return nseHolidaysForYear(year).has(date);
}

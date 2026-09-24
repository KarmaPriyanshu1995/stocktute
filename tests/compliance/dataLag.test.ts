import { describe, expect, it } from "vitest";
import { LAG_DAYS } from "@/config/education";
import {
  EducationalLagError,
  assertEducationalLag,
  calendarDaysBetween,
  istNoon,
  laggedTradingSession,
} from "@/lib/compliance/dataLag";
import { isNseTradingDay } from "@/lib/daily/calendar";

describe("educational lag guard", () => {
  const asOf = istNoon("2026-09-22");

  it("rejects a session 29 calendar days old and passes 30+", () => {
    expect(calendarDaysBetween("2026-08-24", "2026-09-22")).toBe(29);
    expect(calendarDaysBetween("2026-08-23", "2026-09-22")).toBe(30);

    expect(() => assertEducationalLag("2026-08-24", asOf)).toThrow(EducationalLagError);
    expect(() => assertEducationalLag("2026-08-23", asOf)).not.toThrow();
    expect(() => assertEducationalLag("2026-08-22", asOf)).not.toThrow();
  });

  it("picks a lagged NSE trading session at least LAG_DAYS before the run date", () => {
    const session = laggedTradingSession("2026-09-22");
    expect(isNseTradingDay(session)).toBe(true);
    expect(calendarDaysBetween(session, "2026-09-22")).toBeGreaterThanOrEqual(LAG_DAYS);
  });
});

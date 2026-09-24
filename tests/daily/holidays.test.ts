import { describe, expect, it } from "vitest";
import { isListedNseHoliday } from "@/lib/daily/holidays";
import { isNseHoliday, skipReason } from "@/lib/daily/calendar";

describe("NSE holiday JSON", () => {
  it("loads Republic Day 2026 from the yearly file", () => {
    expect(isListedNseHoliday("2026-01-26")).toBe(true);
    expect(isNseHoliday("2026-01-26")).toBe(true);
    expect(skipReason("2026-01-26")).toBe("holiday");
  });

  it("does not treat a listed trading Tuesday as a holiday", () => {
    expect(isListedNseHoliday("2026-09-22")).toBe(false);
    expect(skipReason("2026-09-22")).toBeNull();
  });
});

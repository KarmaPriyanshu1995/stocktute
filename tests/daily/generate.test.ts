import { describe, expect, it } from "vitest";
import { filterParagraph } from "@/lib/daily/compliance";
import { formatIstDate, isNseTradingDay, skipReason } from "@/lib/daily/calendar";
import { chapterPublishStatus, generateDailyChapter } from "@/lib/daily/generate";
import { calendarDaysBetween } from "@/lib/compliance/dataLag";
import { LAG_DAYS } from "@/config/education";
import { virtualPositionSize } from "@/lib/daily/positionSize";

describe("NSE session calendar", () => {
  it("skips weekends and Republic Day, keeps a Tuesday session", () => {
    expect(skipReason("2026-09-20")).toBe("weekend");
    expect(skipReason("2026-01-26")).toBe("holiday");
    expect(isNseTradingDay("2026-09-22")).toBe(true);
    expect(formatIstDate(new Date("2026-09-22T12:00:00+05:30"))).toBe("2026-09-22");
  });
});

describe("compliance filter", () => {
  it("flags live-trade wording and leaves the original sentence unchanged", () => {
    const buyers = filterParagraph("Sellers pushed price down, but buyers stepped in near the low.");
    expect(buyers.flags).toEqual([]);
    expect(buyers.text).toContain("buyers");

    const tip = filterParagraph("Buy RELIANCE, sure-shot, guaranteed, will go up to the target.");
    expect(tip.flags.map((h) => h.phrase)).toEqual(
      expect.arrayContaining(["buy", "sure-shot", "guaranteed", "will go up", "target"]),
    );
    expect(tip.flags.every((f) => !f.resolved)).toBe(true);
    expect(tip.text).toBe("Buy RELIANCE, sure-shot, guaranteed, will go up to the target.");
  });
});

describe("daily chapter generator", () => {
  it("skips a Sunday", () => {
    expect(generateDailyChapter("2026-09-20")).toEqual({ ok: false, skipped: "weekend" });
  });

  it("builds eight fact-grounded sections on a lagged trading session", () => {
    const result = generateDailyChapter("2026-09-22");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chapter.sections).toHaveLength(8);
    expect(result.chapter.isSynthetic).toBe(true);
    expect(isNseTradingDay(result.chapter.sessionDate)).toBe(true);
    expect(calendarDaysBetween(result.chapter.sessionDate, "2026-09-22")).toBeGreaterThanOrEqual(LAG_DAYS);
    expect(result.chapter.sessionDate <= "2026-08-23").toBe(true);
    expect(chapterPublishStatus(result.chapter, true)).toBe("draft");
    expect(result.chapter.disclaimer).toMatch(/Educational content only/);
    const story = result.chapter.sections.find((s) => s.id === "market-story");
    expect(story?.paragraphs.join(" ")).toContain(result.chapter.sessionDate);
    expect(story?.paragraphs.join(" ")).toMatch(/30-day educational delay/);
    const ids = result.chapter.sections.map((s) => s.id);
    expect(ids).toEqual([
      "market-story",
      "pattern-of-day",
      "predict-reveal",
      "spot-it",
      "trap",
      "risk-drill",
      "rule-check",
      "quiz",
    ]);

    const pattern = result.chapter.sections.find((s) => s.id === "pattern-of-day");
    expect(pattern?.chart?.setup.name).toBeTruthy();
    expect(pattern?.paragraphs.join(" ")).toContain(pattern?.chart?.setup.name);

    const trap = result.chapter.sections.find((s) => s.id === "trap");
    expect(trap?.chart?.setup.name).toBeTruthy();

    const predict = result.chapter.sections.find((s) => s.id === "predict-reveal");
    expect(predict?.chart?.hideAfterPattern).toBe(true);
    if (predict?.chart) {
      expect(predict.chart.setup.endIndex).toBeLessThan(predict.chart.candles.length - 1);
    }

    const text = result.chapter.sections.flatMap((s) => s.paragraphs).join(" ").toLowerCase();
    expect(text).not.toMatch(/\bbuy\b/);
    expect(text).not.toMatch(/\bsell\b/);
    expect(text).not.toContain("sure-shot");

    const risk = result.chapter.sections.find((s) => s.id === "risk-drill");
    expect(risk?.extras?.shares).toBeGreaterThan(0);
  });
});

describe("virtual position size", () => {
  it("matches the ₹1,00,000 × 1% classroom formula", () => {
    const sized = virtualPositionSize({
      capital: 100_000,
      riskPct: 1,
      entry: 100.3,
      invalidation: 98.2,
    });
    expect("error" in sized).toBe(false);
    if ("error" in sized) return;
    expect(sized.shares).toBe(Math.floor(1000 / 2.1));
    expect(sized.side).toBe("long-study");
  });
});

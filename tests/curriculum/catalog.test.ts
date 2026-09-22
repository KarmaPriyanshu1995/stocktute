import { describe, expect, it } from "vitest";
import { ALL_LESSONS, LEVELS, courseStats, findLesson } from "@/lib/curriculum/catalog";

describe("curriculum catalog", () => {
  it("has twelve levels and unique slugs", () => {
    expect(LEVELS).toHaveLength(12);
    const slugs = ALL_LESSONS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(courseStats().lessons).toBeGreaterThan(150);
    expect(courseStats().published).toBeGreaterThan(80);
  });

  it("resolves a candlestick lesson", () => {
    const hit = findLesson("hammer");
    expect(hit?.level.id).toBe(2);
    expect(hit?.lesson.status).toBe("published");
  });

  it("keeps F&O locked", () => {
    const fo = LEVELS.find((l) => l.id === 10);
    expect(fo?.modules.flatMap((m) => m.lessons).every((l) => l.status === "locked")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { buildHammerClassroomLesson } from "@/lib/detection/classroomLesson";
import { resolveTeachingChart } from "@/lib/journal/teachingCharts";
import { mistakeNarration, scorePrediction, summarizeHabits } from "@/lib/journal/score";

const lesson = buildHammerClassroomLesson(2);
const setup = lesson.primary.setup;

describe("prediction scoring", () => {
  it("marks a matching 5-bar bucket as correct and attaches no mistake tags", () => {
    const five = setup.forward.find((f) => f.bars === 5);
    expect(five?.closeReturnPct).not.toBeNull();
    const returnPct = five!.closeReturnPct!;
    const direction = returnPct > 0.5 ? "up" : returnPct < -0.5 ? "down" : "sideways";
    const scored = scorePrediction({
      direction,
      reason: "Prior 20-bar downtrend, volume above average, near support.",
      setup,
    });
    expect(scored.matched).toBe(true);
    expect(scored.tags).toEqual([]);
  });

  it("tags a textbook-bias miss and certainty language", () => {
    const missSetup = {
      ...setup,
      forward: setup.forward.map((f) =>
        f.bars === 5
          ? { ...f, closeReturnPct: setup.expectedMove === "up" ? -2 : 2, hitExpected: false }
          : f,
      ),
    };
    const miss = scorePrediction({
      direction: setup.expectedMove,
      reason: "Hammer always means it will go up from here.",
      setup: missSetup,
    });
    expect(miss.matched).toBe(false);
    expect(miss.tags).toContain("wrong-direction");
    expect(miss.tags).toContain("followed-textbook-bias");
    expect(miss.tags).toContain("certainty-language");
  });

  it("tags ignored volume when the student takes the textbook side on light volume", () => {
    const light = {
      ...setup,
      context: { ...setup.context, volumeVsAvg20: 0.4 },
      forward: setup.forward.map((f) =>
        f.bars === 5 ? { ...f, closeReturnPct: -1.2, hitExpected: false } : f,
      ),
    };
    const miss = scorePrediction({
      direction: light.expectedMove,
      reason: "Looks like a hammer so I pick the textbook side.",
      setup: light,
    });
    expect(miss.tags).toContain("ignored-volume");
    expect(miss.tags).toContain("ignored-context");
  });

  it("surfaces habits only after two similar misses", () => {
    expect(summarizeHabits([{ tags: ["followed-textbook-bias", "wrong-direction"] }])).toEqual([]);
    const twice = summarizeHabits([
      { tags: ["followed-textbook-bias", "wrong-direction"] },
      { tags: ["followed-textbook-bias", "wrong-direction"] },
    ]);
    expect(twice.some((h) => h.tag === "followed-textbook-bias" && h.count === 2)).toBe(true);
    expect(twice.map((h) => h.message).join(" ").toLowerCase()).not.toMatch(
      /buy|sell|guaranteed profit/,
    );
  });

  it("mistake copy uses engine numbers and never names a live trade", () => {
    const missSetup = {
      ...setup,
      forward: setup.forward.map((f) =>
        f.bars === 5 ? { ...f, closeReturnPct: -1.25, hitExpected: false } : f,
      ),
    };
    const scored = scorePrediction({
      direction: "up",
      reason: "Hammer always means bounce.",
      setup: missSetup,
    });
    const text = mistakeNarration({
      setup: missSetup,
      direction: "up",
      reason: "Hammer always means bounce.",
      scored,
    }).join(" ");
    expect(text).toContain("-1.25%");
    expect(text).not.toMatch(/buy RELIANCE|sell RELIANCE/i);
  });
});

describe("teaching chart registry", () => {
  it("resolves the classroom hammer from the engine, not from a made-up pattern", () => {
    const chart = resolveTeachingChart(lesson.chartKey);
    expect(chart?.setup.name).toBe("Hammer");
    expect(resolveTeachingChart("nope")).toBeNull();
  });
});

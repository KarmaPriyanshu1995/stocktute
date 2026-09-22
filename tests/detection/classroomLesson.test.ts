import { describe, expect, it } from "vitest";
import { buildHammerClassroomLesson } from "@/lib/detection/classroomLesson";
import { narrateLayer } from "@/lib/detection/narrate";

describe("classroom historical lesson", () => {
  const lesson = buildHammerClassroomLesson(2);

  it("detects a hammer on the strong, weak, and failed charts", () => {
    expect(lesson.primary.setup.name).toBe("Hammer");
    expect(lesson.weak.setup.name).toBe("Hammer");
    expect(lesson.failed.setup.name).toBe("Hammer");
    expect(lesson.primary.setup.forward[4]?.closeReturnPct).not.toBeNull();
    expect(lesson.chartKey).toBe("classroom:hammer:RELIANCE:1D:primary");
  });

  it("narrates WHAT using only engine prices", () => {
    const script = narrateLayer(lesson.primary.setup, "what");
    const close = lesson.primary.setup.keyLevels.close.toFixed(2);
    expect(script.paragraphs.join(" ")).toContain(`₹${close}`);
    expect(script.paragraphs.join(" ").toLowerCase()).not.toContain("sure-shot");
    expect(script.paragraphs.join(" ")).not.toMatch(/buy RELIANCE|sell RELIANCE/i);
  });

  it("says it lacks a base rate when sampleSize is 0", () => {
    const setup = {
      ...lesson.primary.setup,
      baseRate: { universe: "unavailable", horizonBars: 5 as const, sampleSize: 0, hitRate: null },
    };
    const script = narrateLayer(setup, "reveal");
    expect(script.paragraphs.join(" ")).toContain("I don't have a historical base rate");
  });
});

import { describe, expect, it } from "vitest";
import { CLASSROOM_SESSION_DATE } from "@/config/education";
import { calendarDaysBetween, lastBarSessionDate } from "@/lib/compliance/dataLag";
import {
  allTeachingChartKeys,
  buildClassroomLesson,
  parseChartKey,
} from "@/lib/detection/classroomLesson";
import { TEACHING_PATTERNS } from "@/lib/detection/teachingFixtures";
import { LAG_DAYS } from "@/config/education";

const asOf = new Date("2026-09-22T12:00:00+05:30");

describe("teaching-chart registry", () => {
  it("detects the declared pattern on strong, weak, and failed tapes for all 12 names", () => {
    for (const name of TEACHING_PATTERNS) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const lesson = buildClassroomLesson(`classroom:${slug}:RELIANCE:1D:strong`, { now: asOf });
      expect(lesson.primary.setup.name).toBe(name);
      expect(lesson.weak.setup.name).toBe(name);
      expect(lesson.failed.setup.name).toBe(name);
      expect(lesson.isSynthetic).toBe(true);

      for (const chart of [lesson.primary, lesson.weak, lesson.failed]) {
        const last = lastBarSessionDate(chart.candles);
        expect(last).toBe(CLASSROOM_SESSION_DATE);
        expect(calendarDaysBetween(last!, "2026-09-22")).toBeGreaterThanOrEqual(LAG_DAYS);
      }
    }
  });

  it("parses hammer primary as the strong variant", () => {
    const parsed = parseChartKey("classroom:hammer:RELIANCE:1D:primary");
    expect(parsed?.pattern).toBe("Hammer");
    expect(parsed?.variant).toBe("strong");
    expect(allTeachingChartKeys().length).toBe(1 + TEACHING_PATTERNS.length * 3);
  });
});

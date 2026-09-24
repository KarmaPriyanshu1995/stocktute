/** Thresholds that must not be inlined in scoring, lag, or copy. */

export const LAG_DAYS = 30;

export const ATR_PERIOD = 14;

/** Sideways if |5-bar return %| <= ATR% × this multiplier. */
export const ATR_SIDEWAYS_MULT = 0.5;

/** Reasoning below this is poor process even if direction matched. */
export const REASONING_PASS_SCORE = 50;

/** Last bar of classroom fixtures (must stay ≥ LAG_DAYS before any test "today"). */
export const CLASSROOM_SESSION_DATE = "2025-06-02";

export const ANALYTICS_EVENTS = [
  "lesson_started",
  "prediction_locked",
  "chapter_completed",
  "session_replayed",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

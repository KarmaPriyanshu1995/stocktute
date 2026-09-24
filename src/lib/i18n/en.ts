/** English source strings. Hindi/Hinglish files copy these until human review. */
export const en = {
  "badge.demo": "Demo data",
  "nav.dashboard": "Dashboard",
  "nav.skillTree": "Skill Tree",
  "nav.lessons": "Lessons",
  "nav.classroom": "AI Classroom",
  "nav.drills": "Drills",
  "nav.risk": "Risk calculator",
  "nav.formulas": "Formula Builder",
  "nav.journal": "Journal",
  "nav.admin": "Admin",
  "classroom.title": "AI Classroom",
  "classroom.subtitle":
    "{symbol} · daily · Level {level} vocabulary. Numbers come from the detection engine, not from the tutor inventing them.",
  "classroom.journalLink": "Mistake journal",
  "classroom.sandboxLink": "Historical sandbox",
  "classroom.lock": "Lock prediction and reveal",
  "classroom.locking": "Locking…",
  "classroom.continue": "Continue",
  "classroom.complete": "Lesson complete",
  "classroom.placeholderReason": "One line: which printed fact are you using?",
  "journal.title": "Mistake journal",
  "journal.subtitle":
    "Saved when reasoning is thin or the 5-bar close disagrees — with the engine snapshot. Replay the next bars.",
  "journal.empty": "No journal notes yet. Lock a prediction in the AI Classroom.",
  "sandbox.title": "Historical sandbox",
  "sandbox.subtitle":
    "Lagged, closed bars only. Pattern labels come from the detection engine. Not a live tape and not the graded lesson.",
  "daily.lagNote":
    "Closed session from {sessionDate}, shown after the 30-day educational delay. Not today's market.",
  "disclaimer":
    "Educational content only. Not investment advice. Past patterns do not guarantee future results.",
} as const;

export type MessageKey = keyof typeof en;

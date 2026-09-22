export type LessonStatus = "published" | "locked";

export type PatternWorkbook = {
  definition: string;
  psychology: string;
  rules: string[];
  meaning: string;
  trend: string;
  volume: string;
  entry: string;
  stop: string;
  target: string;
  invalidation: string;
  success: string;
  failed: string;
  exercise: string;
};

export type LessonBody = {
  paragraphs: string[];
  takeaways?: string[];
  pattern?: PatternWorkbook;
};

export type CurriculumLesson = {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  status: LessonStatus;
};

export type CurriculumModule = {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
};

export type CurriculumLevel = {
  id: number;
  name: string;
  goal: string;
  toolHref?: { label: string; href: string };
  lockedUntil?: string;
  modules: CurriculumModule[];
};

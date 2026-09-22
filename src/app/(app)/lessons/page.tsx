import Link from "next/link";
import { LEVELS } from "@/lib/curriculum";
import { LessonStatusBadge } from "@/components/learn/LessonStatusBadge";

export default function LessonsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Lessons</h1>
        <p className="mt-1 text-sm text-text-secondary">
          The full syllabus. Open lessons have teaching notes. Locked lessons show what you will
          study later — they are not hidden so you can see the path.
        </p>
      </div>
      {LEVELS.map((level) => (
        <section key={level.id} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl text-text-primary">
              <span className="font-mono text-sm text-accent">L{level.id}</span> {level.name}
            </h2>
            <Link href="/skill-tree" className="text-xs text-text-tertiary hover:text-accent">
              View in tree
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {level.modules.flatMap((module) =>
              module.lessons.map((item) => (
                <Link
                  key={item.slug}
                  href={`/lessons/${item.slug}`}
                  className="rounded-lg border border-bg-border bg-bg-raised p-4 transition-colors hover:bg-bg-surface-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm text-text-primary">{item.title}</h3>
                    <LessonStatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                    {item.summary}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase text-text-tertiary">
                    {module.title} · {item.minutes} min
                  </p>
                </Link>
              )),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

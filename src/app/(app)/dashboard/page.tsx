import Link from "next/link";
import { auth } from "@/auth";
import { COURSE_RULES, LEVELS, courseStats } from "@/lib/curriculum";

export default async function DashboardPage() {
  const session = await auth();
  const stats = courseStats();
  const nextLesson = LEVELS[0]?.modules[0]?.lessons[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="text-sm text-text-secondary">
          Learn, test, size risk, then paper-trade. The platform does not promise profits or stock
          tips.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <div className="text-xs uppercase tracking-wide text-text-tertiary">Course</div>
          <div className="mt-2 font-mono text-3xl text-text-primary">
            {stats.published}/{stats.lessons}
          </div>
          <p className="mt-1 text-xs text-text-tertiary">open lessons · 12 levels</p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <div className="text-xs uppercase tracking-wide text-text-tertiary">Paper wallet</div>
          <div className="mt-2 font-mono text-3xl text-text-primary">₹5,00,000</div>
          <p className="mt-1 text-xs text-text-tertiary">virtual only</p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <div className="text-xs uppercase tracking-wide text-text-tertiary">Tier</div>
          <div className="mt-2 font-mono text-3xl capitalize text-text-primary">
            {session?.user?.tier ?? "free"}
          </div>
        </div>
      </div>

      {nextLesson && (
        <section className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <p className="text-xs uppercase tracking-wide text-text-tertiary">Start here</p>
          <h2 className="mt-1 font-display text-2xl text-text-primary">{nextLesson.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">{nextLesson.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/lessons/${nextLesson.slug}`}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse"
            >
              Open lesson
            </Link>
            <Link
              href="/skill-tree"
              className="rounded-md border border-bg-border px-4 py-2 text-sm text-text-secondary"
            >
              Full 12-level path
            </Link>
            <Link
              href="/classroom"
              className="rounded-md border border-bg-border px-4 py-2 text-sm text-text-secondary"
            >
              Candlestick classroom
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-primary">Learning path</h2>
        <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {LEVELS.map((level) => (
            <li key={level.id}>
              <Link
                href="/skill-tree"
                className="block rounded-lg border border-bg-border bg-bg-raised px-4 py-3 hover:bg-bg-surface-hover"
              >
                <span className="font-mono text-[10px] text-accent">Level {level.id}</span>
                <div className="text-sm text-text-primary">{level.name}</div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-bg-border bg-bg-raised p-5">
        <h2 className="text-sm font-medium text-text-primary">Rules you agreed to learn by</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {COURSE_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

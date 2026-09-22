import Link from "next/link";
import { notFound } from "next/navigation";
import { findLesson, getLessonContent, nextPublishedLesson } from "@/lib/curriculum";
import { LessonStatusBadge } from "@/components/learn/LessonStatusBadge";
import { PatternWorkbookView } from "@/components/learn/PatternWorkbookView";
import { PositionSizeCalculator } from "@/components/learn/PositionSizeCalculator";

type Props = { params: Promise<{ slug: string }> };

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const hit = findLesson(slug);
  if (!hit) notFound();

  const { lesson, module, level } = hit;
  const content = getLessonContent(slug);
  const next = nextPublishedLesson(slug);

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav className="text-xs text-text-tertiary">
        <Link href="/lessons" className="hover:text-accent">
          Lessons
        </Link>
        <span className="px-2">/</span>
        <span>
          Level {level.id} · {module.title}
        </span>
      </nav>

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LessonStatusBadge status={lesson.status} />
          <span className="font-mono text-[10px] uppercase text-text-tertiary">{lesson.minutes} min</span>
        </div>
        <h1 className="font-display text-4xl text-text-primary">{lesson.title}</h1>
        <p className="text-sm leading-relaxed text-text-secondary">{lesson.summary}</p>
      </header>

      {lesson.status === "locked" && (
        <p className="rounded-md border border-bg-border bg-bg-surface px-4 py-3 text-sm text-text-secondary">
          This lesson is on the syllabus and locked for now
          {level.lockedUntil ? ` — ${level.lockedUntil}` : "."} You can still read the outline so the
          full course is visible.
        </p>
      )}

      {content?.paragraphs.map((p) => (
        <p key={p} className="text-sm leading-relaxed text-text-secondary">
          {p}
        </p>
      ))}

      {content?.takeaways && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {content.takeaways.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {content?.pattern && <PatternWorkbookView pattern={content.pattern} />}

      {slug === "position-sizing" && (
        <section className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <h2 className="mb-4 font-display text-2xl text-text-primary">Calculator</h2>
          <PositionSizeCalculator />
        </section>
      )}

      {!content && lesson.status === "published" && (
        <p className="text-sm leading-relaxed text-text-secondary">
          Use this card as a study prompt. Open the classroom for charts, then come back and write
          one sentence that would invalidate the idea. Educational only — not a recommendation.
        </p>
      )}

      <p className="text-xs text-text-tertiary">
        Educational simulation. Not investment advice. Patterns and indicators are not guaranteed
        signals. Past performance is not future results.
      </p>

      <footer className="flex flex-wrap gap-3 border-t border-bg-border pt-4">
        {level.toolHref && (
          <Link
            href={level.toolHref.href}
            className="rounded-md border border-bg-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
          >
            {level.toolHref.label}
          </Link>
        )}
        {next && next.slug !== slug && (
          <Link
            href={`/lessons/${next.slug}`}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-text-inverse"
          >
            Next: {next.title}
          </Link>
        )}
        <Link href="/drills" className="rounded-md px-3 py-2 text-sm text-text-tertiary hover:text-text-primary">
          Quiz this topic
        </Link>
      </footer>
    </article>
  );
}

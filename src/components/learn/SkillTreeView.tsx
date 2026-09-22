"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LEVELS } from "@/lib/curriculum/catalog";
import { LessonStatusBadge } from "@/components/learn/LessonStatusBadge";
import { cn } from "@/lib/utils";

export function SkillTreeView() {
  const [openId, setOpenId] = useState(1);

  const counts = useMemo(
    () =>
      LEVELS.map((level) => {
        const lessons = level.modules.flatMap((m) => m.lessons);
        return {
          id: level.id,
          total: lessons.length,
          open: lessons.filter((l) => l.status === "published").length,
        };
      }),
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      {LEVELS.map((level, index) => {
        const stats = counts[index];
        const expanded = openId === level.id;
        const locked = stats.open === 0;
        return (
          <article key={level.id} className="rounded-lg border border-bg-border bg-bg-raised">
            <button
              type="button"
              onClick={() => setOpenId(expanded ? 0 : level.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-accent">Level {level.id}</span>
                  <LessonStatusBadge status={locked ? "locked" : "published"} />
                </div>
                <h2 className="mt-1 font-display text-2xl text-text-primary">{level.name}</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-secondary">{level.goal}</p>
                {level.lockedUntil && (
                  <p className="mt-2 text-xs text-text-tertiary">Unlocks when: {level.lockedUntil}</p>
                )}
              </div>
              <div className="shrink-0 font-mono text-xs text-text-tertiary">
                {stats.open}/{stats.total} lessons
              </div>
            </button>
            {expanded && (
              <div className="border-t border-bg-border px-5 py-4">
                {level.toolHref && (
                  <Link
                    href={level.toolHref.href}
                    className="mb-4 inline-flex rounded-md border border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent/10"
                  >
                    {level.toolHref.label}
                  </Link>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  {level.modules.map((module) => (
                    <div key={module.id}>
                      <h3 className="text-xs uppercase tracking-wide text-text-tertiary">{module.title}</h3>
                      <ul className="mt-2 flex flex-col">
                        {module.lessons.map((item) => (
                          <li key={item.slug}>
                            <Link
                              href={`/lessons/${item.slug}`}
                              className={cn(
                                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-bg-surface-hover",
                                item.status === "locked" ? "text-text-tertiary" : "text-text-primary",
                              )}
                            >
                              <span>{item.title}</span>
                              <LessonStatusBadge status={item.status} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

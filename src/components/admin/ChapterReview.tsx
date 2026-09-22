"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LightweightChart } from "@/components/charts/LightweightChart";
import type { BuiltSection } from "@/lib/daily/copy";
import type { ComplianceHit } from "@/lib/daily/compliance";
import { cn } from "@/lib/utils";

export type ChapterView = {
  date: string;
  status: string;
  autoPublish: boolean;
  source: string;
  disclaimer: string;
  sections: BuiltSection[];
  compliance: { blockedCount: number; hits: ComplianceHit[] };
  reviewNote: string;
};

export function ChapterReview({ chapter }: { chapter: ChapterView }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(chapter.sections.map((s) => [s.id, s.paragraphs.join("\n\n")])),
  );
  const [note, setNote] = useState(chapter.reviewNote);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blocked = chapter.compliance.blockedCount;

  async function post(action: "save" | "approve" | "reject" | "publish") {
    setBusy(action);
    setError(null);
    const paragraphs = Object.fromEntries(
      Object.entries(drafts).map(([id, text]) => [
        id,
        text
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean),
      ]),
    );
    try {
      const res = await fetch(`/api/admin/chapters/${chapter.date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: note, paragraphs }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Save failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setBusy(null);
    }
  }

  const statusTone = useMemo(() => {
    if (chapter.status === "published") return "text-accent";
    if (chapter.status === "rejected") return "text-price-down";
    return "text-text-secondary";
  }, [chapter.status]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
            SEBI-partner review · {chapter.source}
          </p>
          <h1 className="font-display text-3xl text-text-primary">Chapter {chapter.date}</h1>
          <p className={cn("text-sm", statusTone)}>Status: {chapter.status}</p>
        </div>
        <p className="text-xs text-text-tertiary">{chapter.disclaimer}</p>
      </div>

      {blocked > 0 && (
        <section className="rounded-lg border border-bg-border bg-bg-raised p-4">
          <h2 className="text-sm font-medium text-text-primary">
            Compliance log ({blocked} rewrite{blocked === 1 ? "" : "s"})
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {chapter.compliance.hits.slice(0, 12).map((hit, i) => (
              <li key={`${hit.phrase}-${i}`}>
                <span className="font-mono text-xs text-accent">{hit.phrase}</span> → {hit.rewritten}
              </li>
            ))}
          </ul>
        </section>
      )}

      {chapter.sections.map((section) => (
        <section key={section.id} className="rounded-lg border border-bg-border bg-bg-raised p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-text-primary">{section.title}</h2>
            <span className="font-mono text-[10px] text-text-tertiary">Unlock at Level {section.minLevel}</span>
          </div>
          {section.chart && (
            <div className="mb-3">
              <LightweightChart
                data={section.chart.candles}
                highlightRange={
                  section.chart.candles[section.chart.setup.startIndex] &&
                  section.chart.candles[section.chart.setup.endIndex]
                    ? {
                        fromTime: section.chart.candles[section.chart.setup.startIndex].time,
                        toTime: section.chart.candles[section.chart.setup.endIndex].time,
                      }
                    : null
                }
                height={220}
              />
              <p className="mt-1 font-mono text-[10px] text-text-tertiary">
                {section.chart.symbol} · {section.chart.setup.name} · engine snapshot
              </p>
            </div>
          )}
          <textarea
            value={drafts[section.id] ?? ""}
            onChange={(e) => setDrafts((d) => ({ ...d, [section.id]: e.target.value }))}
            rows={6}
            className="w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
          {section.quiz && section.quiz.length > 0 && (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-text-secondary">
              {section.quiz.map((q) => (
                <li key={q.id}>
                  {q.prompt}
                  {q.answer ? ` · answer: ${q.answer}` : ""}
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      <label className="text-sm text-text-tertiary">
        Review note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      </label>

      {error && <p className="text-sm text-price-down">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("save")}
          className="rounded-md border border-bg-border px-4 py-2 text-sm text-text-secondary"
        >
          {busy === "save" ? "Saving…" : "Save edits"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("approve")}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse"
        >
          {busy === "approve" ? "…" : chapter.autoPublish ? "Approve & publish" : "Approve"}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("publish")}
          className="rounded-md border border-bg-border px-4 py-2 text-sm text-text-secondary"
        >
          Publish
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void post("reject")}
          className="rounded-md border border-bg-border px-4 py-2 text-sm text-price-down"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

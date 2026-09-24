"use client";

import { useState } from "react";
import Link from "next/link";
import { DemoDataBadge } from "@/components/learn/DemoDataBadge";
import { PatternReplay } from "@/components/learn/PatternReplay";
import { mistakeNarration, scorePrediction, type HabitInsight } from "@/lib/journal/score";
import type { DetectedSetup, ExpectedMove, Ohlcv } from "@/lib/detection/types";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type JournalEntryView = {
  id: string;
  chartKey: string;
  symbol: string;
  timeframe: string;
  patternName: string;
  direction: ExpectedMove;
  confidence: number;
  reason: string;
  actual: ExpectedMove | null;
  closeReturnPct: number | null;
  tags: string[];
  createdAt: string;
  snapshot: { candles: Ohlcv[]; setup: DetectedSetup };
};

type Props = {
  entries: JournalEntryView[];
  habits: HabitInsight[];
  dbError?: boolean;
};

export function JournalClient({ entries, habits, dbError }: Props) {
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? null);
  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl text-text-primary">{t("en", "journal.title")}</h1>
          <DemoDataBadge />
        </div>
        <p className="text-sm text-text-secondary">{t("en", "journal.subtitle")}</p>
      </div>

      {dbError && (
        <p className="rounded-md border border-bg-border px-3 py-2 text-sm text-text-secondary">
          The journal could not reach the database. Your classroom lesson still works; this list
          will fill in when Mongo is available.
        </p>
      )}

      {habits.length > 0 && (
        <section className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <h2 className="text-sm font-medium text-text-primary">Repeated patterns in your misses</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
            {habits.map((h) => (
              <li key={h.tag}>{h.message}</li>
            ))}
          </ul>
        </section>
      )}

      {entries.length === 0 && !dbError ? (
        <div className="rounded-lg border border-bg-border bg-bg-raised p-5">
          <p className="text-sm text-text-secondary">
            No journal notes yet. Lock a prediction in the{" "}
            <Link href="/classroom" className="text-accent">
              AI Classroom
            </Link>{" "}
            — if the 5-bar close disagrees, the chart lands here.
          </p>
        </div>
      ) : null}

      {selected && (
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          <ol className="flex flex-col gap-1">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left",
                    selected.id === entry.id
                      ? "border-accent bg-accent/10"
                      : "border-bg-border bg-bg-raised",
                  )}
                >
                  <div className="font-mono text-[10px] uppercase text-text-tertiary">
                    {entry.symbol} · {entry.timeframe}
                  </div>
                  <div className="text-sm text-text-primary">{entry.patternName}</div>
                  <div className="text-xs text-text-secondary">
                    guessed {entry.direction} · was {entry.actual ?? "unavailable"}
                  </div>
                </button>
              </li>
            ))}
          </ol>

          <div className="rounded-lg border border-bg-border bg-bg-raised p-4">
            <PatternReplay candles={selected.snapshot.candles} setup={selected.snapshot.setup} />
          </div>

          <MistakeNotes entry={selected} />
        </div>
      )}
    </div>
  );
}

function MistakeNotes({ entry }: { entry: JournalEntryView }) {
  const scored = scorePrediction({
    direction: entry.direction,
    reason: entry.reason,
    setup: entry.snapshot.setup,
  });
  const paragraphs = mistakeNarration({
    setup: entry.snapshot.setup,
    direction: entry.direction,
    reason: entry.reason,
    scored,
  });

  return (
    <aside className="flex flex-col rounded-lg border border-bg-border bg-bg-raised">
      <div className="border-b border-bg-border px-4 py-3">
        <h2 className="text-sm font-medium text-text-primary">What this miss shows</h2>
        <p className="mt-1 font-mono text-[10px] text-text-tertiary">
          {new Date(entry.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST ·{" "}
          {entry.confidence}% confidence
        </p>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-sm text-text-secondary">
          Your line: <span className="text-text-primary">{entry.reason}</span>
        </p>
        {paragraphs.map((p) => (
          <p key={p} className="text-sm leading-relaxed text-text-secondary">
            {p}
          </p>
        ))}
        <Link href="/classroom" className="text-xs text-accent">
          Back to classroom
        </Link>
      </div>
    </aside>
  );
}

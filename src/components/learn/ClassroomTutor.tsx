"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LightweightChart } from "@/components/charts/LightweightChart";
import { PatternReplay } from "@/components/learn/PatternReplay";
import type { ClassroomLesson } from "@/lib/detection/classroomLesson";
import {
  LAYERS,
  narrateLayer,
  outcomeBucket,
  type TutorLayer,
} from "@/lib/detection/narrate";
import { scorePrediction } from "@/lib/journal/score";
import type { ExpectedMove } from "@/lib/detection/types";
import { cn } from "@/lib/utils";

const LAYER_LABEL: Record<TutorLayer, string> = {
  what: "1 · What",
  why: "2 · Why",
  context: "3 · Context",
  predict: "4 · Predict",
  reveal: "5 · Reveal",
  failure: "6 · Failure",
};

type Props = { lesson: ClassroomLesson };

export function ClassroomTutor({ lesson }: Props) {
  const [layer, setLayer] = useState<TutorLayer>("what");
  const [direction, setDirection] = useState<ExpectedMove | null>(null);
  const [confidence, setConfidence] = useState(70);
  const [reason, setReason] = useState("");
  const [predicted, setPredicted] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [journaled, setJournaled] = useState(false);

  const primary = lesson.primary;
  const setup = primary.setup;
  const patternFrom = primary.candles[setup.startIndex].time;
  const patternTo = primary.candles[setup.endIndex].time;
  const hiddenStart = setup.endIndex + 1;

  const layerIndex = LAYERS.indexOf(layer);
  const showFuture = layerIndex >= LAYERS.indexOf("reveal");
  const showFailure = layer === "failure";

  const visible = useMemo(
    () => primary.candles.slice(0, hiddenStart),
    [primary.candles, hiddenStart],
  );

  const script = useMemo(() => {
    const fiveFailed = lesson.failed.setup.forward.find((f) => f.bars === 5)?.closeReturnPct ?? null;
    return narrateLayer(layer === "failure" ? lesson.failed.setup : setup, layer, {
      studentLevel: lesson.studentLevel,
      weak: lesson.weak.setup,
      failedFiveBarPct: fiveFailed,
    });
  }, [layer, lesson, setup]);

  const scored = direction
    ? scorePrediction({ direction, reason, setup })
    : null;

  const predictReady = Boolean(direction && reason.trim().length > 8 && confidence >= 50);
  const canAdvance = layer === "predict" ? predictReady : layer !== "failure";

  async function goNext() {
    const i = LAYERS.indexOf(layer);
    if (layer === "predict") {
      if (!predictReady || !direction) return;
      setSaveState("saving");
      try {
        const res = await fetch("/api/predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chartKey: lesson.chartKey,
            direction,
            confidence,
            reason: reason.trim(),
          }),
        });
        const data = (await res.json().catch(() => null)) as
          | { journaled?: boolean }
          | null;
        setSaveState(res.ok ? "saved" : "error");
        setJournaled(Boolean(data?.journaled));
      } catch {
        setSaveState("error");
      }
      setPredicted(true);
    }
    if (i < LAYERS.length - 1) setLayer(LAYERS[i + 1]);
  }

  const five = setup.forward.find((f) => f.bars === 5);
  const actual = outcomeBucket(five?.closeReturnPct ?? null);

  const failFrom = lesson.failed.candles[lesson.failed.setup.startIndex].time;
  const failTo = lesson.failed.candles[lesson.failed.setup.endIndex].time;
  const failVisible = lesson.failed.candles.slice(0, lesson.failed.setup.endIndex + 11);
  const failHighlight = { fromTime: failFrom, toTime: failTo };
  const failMarkers = [
    {
      time: failTo,
      position: lesson.failed.setup.bias === "bearish" ? ("aboveBar" as const) : ("belowBar" as const),
      shape: lesson.failed.setup.bias === "bearish" ? ("arrowDown" as const) : ("arrowUp" as const),
      color: "#c6ff3d",
      text: lesson.failed.setup.name,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-text-primary">AI Classroom</h1>
          <p className="text-sm text-text-secondary">
            {lesson.symbol} · daily · Level {lesson.studentLevel} vocabulary. Numbers come from the
            detection engine, not from the tutor inventing them.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/journal" className="text-xs text-text-tertiary hover:text-accent">
            Mistake journal
          </Link>
          <Link href="/classroom/live" className="text-xs text-text-tertiary hover:text-accent">
            Live tape (sandbox)
          </Link>
        </div>
      </div>

      <ol className="flex flex-wrap gap-1">
        {LAYERS.map((id, i) => (
          <li key={id}>
            <button
              type="button"
              disabled={i > layerIndex}
              onClick={() => {
                if (i <= layerIndex) setLayer(id);
              }}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide",
                layer === id
                  ? "border-accent bg-accent/10 text-accent"
                  : i <= layerIndex
                    ? "border-bg-border text-text-secondary"
                    : "border-bg-border text-text-tertiary opacity-50",
              )}
            >
              {LAYER_LABEL[id]}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-bg-border bg-bg-raised p-4">
            {showFailure ? (
              <LightweightChart
                data={failVisible}
                markers={failMarkers}
                highlightTime={failTo}
                highlightRange={failHighlight}
                height={400}
              />
            ) : showFuture ? (
              <PatternReplay candles={primary.candles} setup={setup} height={400} />
            ) : (
              <LightweightChart
                data={visible}
                markers={[
                  {
                    time: patternTo,
                    position: setup.bias === "bearish" ? "aboveBar" : "belowBar",
                    shape: setup.bias === "bearish" ? "arrowDown" : "arrowUp",
                    color: "#c6ff3d",
                    text: setup.name,
                  },
                ]}
                highlightTime={patternTo}
                highlightRange={{ fromTime: patternFrom, toTime: patternTo }}
                height={400}
              />
            )}
          </div>

          {layer === "context" && (
            <div className="grid gap-3 md:grid-cols-2">
              <MiniChart title="Stronger context" lesson={lesson.primary} />
              <MiniChart title="Weaker context" lesson={lesson.weak} />
            </div>
          )}
        </div>

        <aside className="flex flex-col rounded-lg border border-bg-border bg-bg-raised">
          <div className="border-b border-bg-border px-4 py-3">
            <h2 className="text-sm font-medium text-text-primary">{script.title}</h2>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {script.paragraphs.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-text-secondary">
                {p}
              </p>
            ))}

            {layer === "predict" && (
              <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
                <div className="flex gap-2">
                  {(["up", "down", "sideways"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-2 text-xs uppercase",
                        direction === d
                          ? "border-accent text-accent"
                          : "border-bg-border text-text-secondary",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <label className="text-xs text-text-tertiary">
                  Confidence {confidence}%
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
                <textarea
                  required
                  minLength={8}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="One line: which printed fact are you using?"
                  className="rounded-md border border-bg-border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </form>
            )}

            {layer === "reveal" && predicted && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-secondary">
                  You guessed <span className="text-text-primary">{direction}</span> at {confidence}%.
                  Five-bar bucket from the engine:{" "}
                  <span className="text-text-primary">{actual ?? "I don't have that data"}</span>. A
                  match or miss on one chart is not a verdict on hammers in general.
                </p>
                {journaled && (
                  <Link href="/journal" className="text-xs text-accent">
                    This miss is saved in your mistake journal with the chart snapshot.
                  </Link>
                )}
                {scored?.matched === true && (
                  <p className="text-xs text-text-tertiary">
                    Direction matched this snapshot. It still does not prove the pattern.
                  </p>
                )}
                {saveState === "error" && (
                  <p className="text-xs text-text-tertiary">
                    Prediction is locked on this chart, but the journal could not be saved.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={
                !canAdvance ||
                saveState === "saving" ||
                (layer === "predict" && !predictReady) ||
                layer === "failure"
              }
              onClick={() => void goNext()}
              className="mt-auto rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse disabled:opacity-40"
            >
              {layer === "predict"
                ? saveState === "saving"
                  ? "Locking…"
                  : "Lock prediction and reveal"
                : layer === "failure"
                  ? "Lesson complete"
                  : "Continue"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MiniChart({ title, lesson }: { title: string; lesson: ClassroomLesson["primary"] }) {
  const s = lesson.setup;
  const from = lesson.candles[s.startIndex].time;
  const to = lesson.candles[s.endIndex].time;
  return (
    <div className="rounded-lg border border-bg-border bg-bg-raised p-3">
      <p className="mb-2 text-xs text-text-tertiary">{title}</p>
      <LightweightChart
        data={lesson.candles.slice(0, s.endIndex + 1)}
        highlightRange={{ fromTime: from, toTime: to }}
        height={180}
      />
    </div>
  );
}

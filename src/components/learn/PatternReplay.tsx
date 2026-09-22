"use client";

import { useEffect, useMemo, useState } from "react";
import { LightweightChart } from "@/components/charts/LightweightChart";
import type { DetectedSetup, Ohlcv } from "@/lib/detection/types";

type Props = {
  candles: Ohlcv[];
  setup: DetectedSetup;
  height?: number;
};

/** Play / pause / step through bars after the pattern — same control as the classroom reveal. */
export function PatternReplay({ candles, setup, height = 320 }: Props) {
  const hiddenStart = setup.endIndex + 1;
  const maxReveal = Math.min(10, Math.max(0, candles.length - hiddenStart));
  const [revealed, setRevealed] = useState(0);
  const [playing, setPlaying] = useState(false);

  const patternFrom = candles[setup.startIndex]?.time;
  const patternTo = candles[setup.endIndex]?.time;

  const visible = useMemo(
    () => candles.slice(0, hiddenStart + revealed),
    [candles, hiddenStart, revealed],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setRevealed((n) => {
        if (n >= maxReveal) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, [playing, maxReveal]);

  if (patternFrom == null || patternTo == null) return null;

  return (
    <div>
      <LightweightChart
        data={visible}
        highlightTime={patternTo}
        highlightRange={{ fromTime: patternFrom, toTime: patternTo }}
        markers={[
          {
            time: patternTo,
            position: setup.bias === "bearish" ? "aboveBar" : "belowBar",
            shape: setup.bias === "bearish" ? "arrowDown" : "arrowUp",
            color: "#c6ff3d",
            text: setup.name,
          },
        ]}
        height={height}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-bg-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-surface-hover"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="rounded-md border border-bg-border px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-surface-hover"
          onClick={() => {
            setPlaying(false);
            setRevealed((n) => Math.min(maxReveal, n + 1));
          }}
        >
          Step
        </button>
        <span className="font-mono text-[11px] text-text-tertiary">
          Revealed {revealed}/{maxReveal} bars after the pattern
        </span>
      </div>
    </div>
  );
}

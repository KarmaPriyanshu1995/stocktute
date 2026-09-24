"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LightweightChart, type ChartMarker } from "@/components/charts/LightweightChart";
import { DemoDataBadge } from "@/components/learn/DemoDataBadge";
import { analyzeChart } from "@/lib/detection/engine";
import { track } from "@/lib/analytics/track";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const SYMBOLS = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "SBIN",
  "BHARTIARTL",
  "ITC",
  "KOTAKBANK",
] as const;

const TIMEFRAMES = ["15m", "1D"] as const;
type SandboxTf = (typeof TIMEFRAMES)[number];

type Candle = { time: number; open: number; high: number; low: number; close: number; volume?: number };

export default function HistoricalSandboxPage() {
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("RELIANCE");
  const [timeframe, setTimeframe] = useState<SandboxTf>("1D");
  const [history, setHistory] = useState<Candle[]>([]);
  const [isSynthetic, setIsSynthetic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [head, setHead] = useState(80);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setError(null);
    fetch(`/api/candles/${symbol}?timeframe=${timeframe}&limit=300`)
      .then(async (r) => {
        const data = (await r.json()) as { candles?: Candle[]; isSynthetic?: boolean; error?: string };
        if (!r.ok) {
          setHistory([]);
          setError(data.error === "educational_lag" ? "This tape is inside the 30-day educational lag." : "Could not load lagged candles.");
          return;
        }
        const candles = data.candles ?? [];
        setHistory(candles);
        setIsSynthetic(data.isSynthetic !== false);
        setHead(Math.min(80, candles.length));
      })
      .catch(() => {
        setHistory([]);
        setError("Could not load lagged candles.");
      });
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setHead((n) => {
        if (n >= history.length) {
          setPlaying(false);
          return n;
        }
        return n + 1;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [playing, history.length]);

  const visible = useMemo(() => history.slice(0, Math.max(1, head)), [history, head]);
  const facts = useMemo(
    () => analyzeChart({ candles: visible, symbol, timeframe, isSynthetic: true }),
    [visible, symbol, timeframe],
  );
  const markers: ChartMarker[] = facts.setups.slice(-12).map((s) => {
    const bar = visible[s.endIndex];
    return {
      time: bar?.time ?? 0,
      position: s.bias === "bearish" ? "aboveBar" : "belowBar",
      shape: s.bias === "bearish" ? "arrowDown" : "arrowUp",
      color: s.bias === "bearish" ? "#ff5c5c" : "#3ddc84",
      text: s.name,
    };
  });

  function onPlay() {
    if (!playing) track("session_replayed", { symbol, timeframe });
    setPlaying((p) => !p);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/classroom" className="text-xs text-accent">
          ← Back to 6-layer classroom
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl text-text-primary">{t("en", "sandbox.title")}</h1>
          <DemoDataBadge show={isSynthetic} />
        </div>
        <p className="text-sm text-text-secondary">{t("en", "sandbox.subtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SYMBOLS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSymbol(s)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-xs",
              s === symbol ? "border-accent text-accent" : "border-bg-border text-text-secondary",
            )}
          >
            {s}
          </button>
        ))}
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setTimeframe(tf)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-xs uppercase",
              tf === timeframe ? "border-accent text-accent" : "border-bg-border text-text-secondary",
            )}
          >
            {tf}
          </button>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-price-down">{error}</p>
      ) : (
        <div className="rounded-lg border border-bg-border bg-bg-raised p-4">
          <LightweightChart data={visible} markers={markers} height={460} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-bg-border px-3 py-1.5 text-xs text-text-secondary"
              onClick={onPlay}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="rounded-md border border-bg-border px-3 py-1.5 text-xs text-text-secondary"
              onClick={() => {
                setPlaying(false);
                setHead((n) => Math.min(history.length, n + 1));
              }}
            >
              Step
            </button>
            <span className="font-mono text-[11px] text-text-tertiary">
              {visible.length}/{history.length} lagged bars · engine labels only
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

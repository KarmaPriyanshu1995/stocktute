"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LightweightChart, type Candle, type ChartMarker } from "@/components/charts/LightweightChart";
import { useLiveQuotes } from "@/lib/priceFeed/useLiveQuotes";
import { CandleBuilder } from "@/lib/priceFeed/candleBuilder";
import { generateHistory } from "@/lib/priceFeed/generateHistory";
import { detectCandlestickPatterns, type DetectedPattern } from "@/lib/charts/candlestickPatterns";
import { TIMEFRAMES, type Timeframe } from "@/lib/priceFeed/timeframes";
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

function toMarkers(patterns: DetectedPattern[]): ChartMarker[] {
  return patterns.map((p) => ({
    time: p.time,
    position: p.bias === "bearish" ? "aboveBar" : "belowBar",
    shape: p.bias === "bearish" ? "arrowDown" : p.bias === "bullish" ? "arrowUp" : "circle",
    color: p.bias === "bearish" ? "#ff5c5c" : p.bias === "bullish" ? "#3ddc84" : "#c6ff3d",
    text: p.name,
  }));
}

export default function LiveTapePage() {
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("RELIANCE");
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [history, setHistory] = useState<Candle[]>([]);
  const [liveCandle, setLiveCandle] = useState<Candle | null>(null);
  const builderRef = useRef(new CandleBuilder(["1m", "5m", "15m", "1D"]));
  const quotes = useLiveQuotes([symbol]);
  const quote = quotes[symbol];

  useEffect(() => {
    builderRef.current = new CandleBuilder(["1m", "5m", "15m", "1D"]);
    setLiveCandle(null);
    setHistory(generateHistory(symbol, timeframe, 240));
    fetch(`/api/candles/${symbol}?timeframe=${timeframe}&limit=300`)
      .then((r) => r.json())
      .then((data: { candles?: Candle[] }) => {
        if (data.candles && data.candles.length >= 80) setHistory(data.candles);
      })
      .catch(() => undefined);
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!quote) return;
    builderRef.current.ingest({
      symbol: quote.symbol,
      price: quote.price,
      volume: quote.volume,
      timestamp: quote.timestamp,
    });
    const forming = builderRef.current.getForming(quote.symbol, timeframe);
    if (forming) setLiveCandle(forming);
  }, [quote, timeframe]);

  const candles = useMemo(() => {
    if (!liveCandle || history.length === 0) return history;
    const last = history[history.length - 1];
    if (liveCandle.time === last.time) return [...history.slice(0, -1), liveCandle];
    if (liveCandle.time > last.time) return [...history, liveCandle];
    return history;
  }, [history, liveCandle]);

  const markers = useMemo(() => toMarkers(detectCandlestickPatterns(candles)), [candles]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/classroom" className="text-xs text-accent">
          ← Back to 6-layer classroom
        </Link>
        <h1 className="mt-2 font-display text-3xl text-text-primary">Live tape</h1>
        <p className="text-sm text-text-secondary">Sandbox feed for pattern labels. Not the graded lesson.</p>
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
      <div className="rounded-lg border border-bg-border bg-bg-raised p-4">
        <LightweightChart data={candles} liveCandle={liveCandle} markers={markers} height={460} />
      </div>
    </div>
  );
}

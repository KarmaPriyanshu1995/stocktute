"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function biasClass(bias: DetectedPattern["bias"]) {
  if (bias === "bullish") return "text-price-up";
  if (bias === "bearish") return "text-price-down";
  return "text-text-secondary";
}

function toMarkers(patterns: DetectedPattern[]): ChartMarker[] {
  return patterns.map((p) => ({
    time: p.time,
    position: p.bias === "bearish" ? "aboveBar" : "belowBar",
    shape: p.bias === "bearish" ? "arrowDown" : p.bias === "bullish" ? "arrowUp" : "circle",
    color: p.bias === "bearish" ? "#ff5c5c" : p.bias === "bullish" ? "#3ddc84" : "#c6ff3d",
    text: p.name,
  }));
}

export default function ClassroomPage() {
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("RELIANCE");
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [history, setHistory] = useState<Candle[]>([]);
  const [liveCandle, setLiveCandle] = useState<Candle | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const builderRef = useRef(new CandleBuilder(["1m", "5m", "15m", "1D"]));

  const quotes = useLiveQuotes([symbol]);
  const quote = quotes[symbol];

  useEffect(() => {
    builderRef.current = new CandleBuilder(["1m", "5m", "15m", "1D"]);
    setLiveCandle(null);
    setSelectedPatternId(null);
    setHistory(generateHistory(symbol, timeframe, 240));

    fetch(`/api/candles/${symbol}?timeframe=${timeframe}&limit=300`)
      .then((r) => r.json())
      .then((data: { candles?: Candle[] }) => {
        if (data.candles && data.candles.length >= 80) {
          const withBodies = data.candles.filter((c) => {
            const range = c.high - c.low;
            return range > 0 && Math.abs(c.close - c.open) / range > 0.12;
          }).length;
          if (withBodies >= data.candles.length * 0.35) setHistory(data.candles);
        }
      })
      .catch(() => {
        /* generated history already on screen */
      });
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
    if (liveCandle.time === last.time) {
      return [...history.slice(0, -1), liveCandle];
    }
    if (liveCandle.time > last.time) return [...history, liveCandle];
    return history;
  }, [history, liveCandle]);

  const patterns = useMemo(() => detectCandlestickPatterns(candles), [candles]);
  const markers = useMemo(() => toMarkers(patterns), [patterns]);
  const selected = patterns.find((p) => p.id === selectedPatternId) ?? null;

  const changeColor = useMemo(() => {
    if (!quote || candles.length === 0) return "text-text-primary";
    const prevClose = candles[candles.length - 1]?.close ?? quote.price;
    return cn(quote.price > prevClose && "text-price-up", quote.price < prevClose && "text-price-down");
  }, [quote, candles]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-text-primary">AI Classroom</h1>
          <p className="text-sm text-text-secondary">
            Candlestick patterns are marked on the chart. Click a pattern to jump to it and read why it
            matters.
          </p>
        </div>
        {quote && (
          <div className="text-right font-mono">
            <div className={cn("text-2xl tabular-nums", changeColor)}>₹{quote.price.toFixed(2)}</div>
            <div className="text-xs text-text-tertiary">
              as of {new Date(quote.timestamp * 1000).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SYMBOLS.map((s) => (
          <button
            key={s}
            onClick={() => setSymbol(s)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-xs transition-colors",
              s === symbol
                ? "border-accent bg-accent/10 text-accent"
                : "border-bg-border text-text-secondary hover:bg-bg-surface-hover",
            )}
          >
            {s}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-bg-border" />
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-xs uppercase transition-colors",
              tf === timeframe
                ? "border-accent bg-accent/10 text-accent"
                : "border-bg-border text-text-secondary hover:bg-bg-surface-hover",
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-bg-border bg-bg-raised p-4">
          <LightweightChart
            data={candles}
            liveCandle={liveCandle}
            markers={markers}
            highlightTime={selected?.time ?? null}
            height={460}
          />
        </div>

        <aside className="flex max-h-[492px] flex-col rounded-lg border border-bg-border bg-bg-raised">
          <div className="border-b border-bg-border px-4 py-3">
            <h2 className="text-sm font-medium text-text-primary">Patterns on this chart</h2>
            <p className="text-xs text-text-tertiary">{patterns.length} setups to study</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {patterns.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-secondary">
                No textbook patterns on this slice yet. Switch timeframe or symbol.
              </p>
            ) : (
              patterns
                .slice()
                .reverse()
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatternId(p.id)}
                    className={cn(
                      "block w-full border-b border-bg-border px-4 py-3 text-left transition-colors hover:bg-bg-surface-hover",
                      selectedPatternId === p.id && "bg-bg-surface",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-text-primary">{p.name}</span>
                      <span className={cn("font-mono text-[10px] uppercase", biasClass(p.bias))}>{p.bias}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-text-tertiary">
                      {new Date(p.time * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                    </div>
                  </button>
                ))
            )}
          </div>
          {selected && (
            <div className="border-t border-bg-border px-4 py-3">
              <p className="text-xs leading-relaxed text-text-secondary">{selected.description}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type CandlestickData,
  type SeriesMarker,
  type UTCTimestamp,
} from "lightweight-charts";

export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartMarker = {
  time: number;
  position: "aboveBar" | "belowBar";
  shape: "arrowUp" | "arrowDown" | "circle";
  color: string;
  text: string;
};

type Props = {
  data: Candle[];
  /** Applied to the most recent bar as ticks arrive, without re-setting the whole series. */
  liveCandle?: Candle | null;
  markers?: ChartMarker[];
  highlightTime?: number | null;
  /** Inclusive time range whose bodies get a brighter border (pattern candles). */
  highlightRange?: { fromTime: number; toTime: number } | null;
  height?: number;
  className?: string;
};

function toBar(c: Candle): CandlestickData {
  return { ...c, time: c.time as UTCTimestamp };
}

export function LightweightChart({
  data,
  liveCandle,
  markers = [],
  highlightTime = null,
  highlightRange = null,
  height = 420,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<UTCTimestamp> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9da3ac",
        fontFamily: "var(--font-mono), monospace",
      },
      grid: {
        vertLines: { color: "rgba(36,43,51,0.6)" },
        horzLines: { color: "rgba(36,43,51,0.6)" },
      },
      rightPriceScale: { borderColor: "#242b33" },
      timeScale: {
        borderColor: "#242b33",
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 10,
        minBarSpacing: 6,
      },
      crosshair: { mode: 0 },
      width: container.clientWidth,
      height,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#3ddc84",
      downColor: "#ff5c5c",
      borderVisible: true,
      borderUpColor: "#3ddc84",
      borderDownColor: "#ff5c5c",
      wickUpColor: "#3ddc84",
      wickDownColor: "#ff5c5c",
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    const resize = () => chart.applyOptions({ width: container.clientWidth });
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || data.length === 0) return;
    series.setData(
      data.map((c) => {
        const bar = toBar(c);
        if (
          highlightRange &&
          c.time >= highlightRange.fromTime &&
          c.time <= highlightRange.toTime
        ) {
          return {
            ...bar,
            borderColor: "#c6ff3d",
            wickColor: "#c6ff3d",
          };
        }
        return bar;
      }),
    );
    chartRef.current?.timeScale().fitContent();
  }, [data, highlightRange]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !liveCandle) return;
    series.update(toBar(liveCandle));
  }, [liveCandle]);

  useEffect(() => {
    const api = markersRef.current;
    if (!api) return;
    const next: SeriesMarker<UTCTimestamp>[] = markers.map((m) => ({
      time: m.time as UTCTimestamp,
      position: m.position,
      shape: m.shape,
      color: m.color,
      text: m.text,
    }));
    api.setMarkers(next);
  }, [markers]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || highlightTime == null || data.length === 0) return;
    const index = data.findIndex((c) => c.time === highlightTime);
    if (index < 0) return;
    const from = Math.max(0, index - 18);
    const to = Math.min(data.length - 1, index + 8);
    chart.timeScale().setVisibleLogicalRange({ from, to });
  }, [highlightTime, data]);

  return <div ref={containerRef} className={className} style={{ height }} />;
}

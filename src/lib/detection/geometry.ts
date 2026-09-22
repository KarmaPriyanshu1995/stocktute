import type { Ohlcv } from "./types";

export type Geometry = {
  body: number;
  range: number;
  upper: number;
  lower: number;
  bullish: boolean;
  bearish: boolean;
};

export function geom(c: Pick<Ohlcv, "open" | "high" | "low" | "close">): Geometry {
  const body = Math.abs(c.close - c.open);
  const range = Math.max(c.high - c.low, 1e-9);
  return {
    body,
    range,
    upper: c.high - Math.max(c.open, c.close),
    lower: Math.min(c.open, c.close) - c.low,
    bullish: c.close > c.open,
    bearish: c.close < c.open,
  };
}

export function isDoji(g: Geometry): boolean {
  return g.body / g.range <= 0.12;
}

export function midpoint(open: number, close: number): number {
  return (open + close) / 2;
}

export function pctChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / from) * 100;
}

export function round(value: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

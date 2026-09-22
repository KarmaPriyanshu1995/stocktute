import type { Ohlcv } from "@/lib/detection/types";

export function makeBar(time: number, open: number, high: number, low: number, close: number, volume = 10_000): Ohlcv {
  return { time, open, high, low, close, volume };
}

/** Sequential daily bars. `rows` are [open, high, low, close, volume?]. */
export function fromRows(rows: Array<[number, number, number, number] | [number, number, number, number, number]>, start = 1_700_000_000): Ohlcv[] {
  return rows.map((row, i) =>
    makeBar(start + i * 86_400, row[0], row[1], row[2], row[3], row[4] ?? 10_000),
  );
}

/** Drifted bars so EMA/RSI have enough history before a textbook pattern. */
export function drift(count: number, startPrice: number, step: number, startTime = 1_700_000_000): Ohlcv[] {
  const rows: Array<[number, number, number, number, number]> = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = price + step;
    rows.push([open, Math.max(open, close) + 0.4, Math.min(open, close) - 0.4, close, 8_000]);
    price = close;
  }
  return fromRows(rows, startTime);
}

export function append(base: Ohlcv[], extra: Ohlcv[]): Ohlcv[] {
  if (base.length === 0) return extra;
  const last = base[base.length - 1].time;
  return [
    ...base,
    ...extra.map((c, i) => ({ ...c, time: last + (i + 1) * 86_400 })),
  ];
}

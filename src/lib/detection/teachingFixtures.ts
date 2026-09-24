import { CLASSROOM_SESSION_DATE } from "@/config/education";
import { sessionCloseUnix } from "@/lib/daily/calendar";
import { append, drift, fromRows } from "./fixtures";
import type { Ohlcv } from "./types";

export type TeachingVariant = "strong" | "weak" | "failed";

export const TEACHING_PATTERNS = [
  "Hammer",
  "Hanging Man",
  "Inverted Hammer",
  "Shooting Star",
  "Bullish Engulfing",
  "Bearish Engulfing",
  "Piercing Line",
  "Dark Cloud Cover",
  "Morning Star",
  "Evening Star",
  "Three White Soldiers",
  "Three Black Crows",
] as const;

export type TeachingPatternName = (typeof TEACHING_PATTERNS)[number];

const BULLISH: ReadonlySet<string> = new Set([
  "Hammer",
  "Inverted Hammer",
  "Bullish Engulfing",
  "Piercing Line",
  "Morning Star",
  "Three White Soldiers",
]);

export function slugForPattern(name: TeachingPatternName): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function alignToSession(candles: Ohlcv[], sessionDate = CLASSROOM_SESSION_DATE): Ohlcv[] {
  const lastTime = sessionCloseUnix(sessionDate);
  const n = candles.length;
  return candles.map((c, i) => ({ ...c, time: lastTime - (n - 1 - i) * 86_400 }));
}

function pack(prefix: Ohlcv[], pattern: Ohlcv[], followThrough: Ohlcv[], sessionDate: string): Ohlcv[] {
  return alignToSession(append(append(prefix, pattern), followThrough), sessionDate);
}

type Recipe = {
  prior: "down" | "up" | "flat";
  priorStart: number;
  rows: Array<[number, number, number, number, number]>;
  lastClose: number;
  upStep: number;
  downStep: number;
};

const RECIPES: Record<TeachingPatternName, Recipe> = {
  Hammer: {
    prior: "down",
    priorStart: 136,
    rows: [[100.4, 100.6, 98.2, 100.3, 22_000]],
    lastClose: 100.3,
    upStep: 0.55,
    downStep: -0.7,
  },
  "Hanging Man": {
    prior: "up",
    priorStart: 72,
    rows: [[100.4, 100.6, 98.2, 100.3, 22_000]],
    lastClose: 100.3,
    upStep: 0.55,
    downStep: -0.7,
  },
  "Inverted Hammer": {
    prior: "down",
    priorStart: 136,
    rows: [[100.2, 103.5, 100.0, 100.4, 22_000]],
    lastClose: 100.4,
    upStep: 0.55,
    downStep: -0.7,
  },
  "Shooting Star": {
    prior: "up",
    priorStart: 72,
    rows: [[100.2, 103.5, 100.0, 100.4, 22_000]],
    lastClose: 100.4,
    upStep: 0.55,
    downStep: -0.7,
  },
  "Bullish Engulfing": {
    prior: "down",
    priorStart: 118,
    rows: [
      [100, 100.3, 97.4, 97.8, 9_000],
      [97.6, 101.2, 97.5, 100.8, 22_000],
    ],
    lastClose: 100.8,
    upStep: 0.5,
    downStep: -0.65,
  },
  "Bearish Engulfing": {
    prior: "up",
    priorStart: 78,
    rows: [
      [98, 101.2, 97.8, 100.8, 9_000],
      [101, 101.3, 97.4, 97.6, 22_000],
    ],
    lastClose: 97.6,
    upStep: 0.5,
    downStep: -0.65,
  },
  "Piercing Line": {
    prior: "down",
    priorStart: 118,
    rows: [
      [100, 100.2, 97.6, 98, 9_000],
      [97.4, 99.4, 97.3, 99.2, 22_000],
    ],
    lastClose: 99.2,
    upStep: 0.5,
    downStep: -0.65,
  },
  "Dark Cloud Cover": {
    prior: "up",
    priorStart: 78,
    rows: [
      [98, 100.4, 97.8, 100.2, 9_000],
      [100.6, 100.8, 98.6, 98.9, 22_000],
    ],
    lastClose: 98.9,
    upStep: 0.5,
    downStep: -0.65,
  },
  "Morning Star": {
    prior: "down",
    priorStart: 122,
    rows: [
      [100, 100.2, 96.8, 97, 9_000],
      [96.9, 97.4, 96.4, 97.1, 6_000],
      [97.2, 100.6, 97.1, 100.1, 22_000],
    ],
    lastClose: 100.1,
    upStep: 0.5,
    downStep: -0.65,
  },
  "Evening Star": {
    prior: "up",
    priorStart: 78,
    rows: [
      [97, 100.4, 96.8, 100.2, 9_000],
      [100.3, 100.8, 99.8, 100.1, 6_000],
      [100, 100.2, 96.6, 96.9, 22_000],
    ],
    lastClose: 96.9,
    upStep: 0.5,
    downStep: -0.65,
  },
  "Three White Soldiers": {
    prior: "down",
    priorStart: 118,
    rows: [
      [100, 101.2, 99.8, 101, 12_000],
      [100.9, 102.2, 100.8, 102, 14_000],
      [101.9, 103.2, 101.8, 103, 22_000],
    ],
    lastClose: 103,
    upStep: 0.45,
    downStep: -0.6,
  },
  "Three Black Crows": {
    prior: "up",
    priorStart: 78,
    rows: [
      [103, 103.2, 101.8, 102, 12_000],
      [102.1, 102.2, 100.8, 101, 14_000],
      [101.1, 101.2, 99.8, 100, 22_000],
    ],
    lastClose: 100,
    upStep: 0.45,
    downStep: -0.6,
  },
};

function prefix(recipe: Recipe, variant: TeachingVariant): Ohlcv[] {
  const n = 45;
  if (variant === "weak") {
    const step = recipe.prior === "up" ? 0.35 : -0.35;
    const start = recipe.prior === "up" ? recipe.lastClose - 15 : recipe.lastClose + 15;
    return drift(n, start, step, 1, 4_000);
  }
  const step = recipe.prior === "up" ? 0.6 : -0.8;
  return drift(n, recipe.priorStart, step, 1, 9_000);
}

function patternRows(recipe: Recipe, variant: TeachingVariant): Ohlcv[] {
  const vol = variant === "weak" ? 3_200 : recipe.rows[recipe.rows.length - 1][4];
  const rows = recipe.rows.map((row, i) => {
    const copy: [number, number, number, number, number] = [row[0], row[1], row[2], row[3], row[4]];
    if (i === recipe.rows.length - 1) copy[4] = vol;
    return copy;
  });
  return fromRows(rows);
}

export function buildTeachingCandles(
  name: TeachingPatternName,
  variant: TeachingVariant,
  sessionDate = CLASSROOM_SESSION_DATE,
): Ohlcv[] {
  const recipe = RECIPES[name];
  const bullish = BULLISH.has(name);
  const textbook = bullish ? recipe.upStep : recipe.downStep;
  const against = bullish ? recipe.downStep : recipe.upStep;
  const followStep = variant === "failed" ? against : variant === "weak" ? textbook * 0.12 : textbook;
  const followVol = variant === "weak" ? 3_500 : 11_000;
  return pack(
    prefix(recipe, variant),
    patternRows(recipe, variant),
    drift(10, recipe.lastClose, followStep, 1, followVol),
    sessionDate,
  );
}

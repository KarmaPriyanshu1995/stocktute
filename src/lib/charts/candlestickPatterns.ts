export type PatternBias = "bullish" | "bearish" | "neutral";

export type CandleOHLC = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type DetectedPattern = {
  id: string;
  name: string;
  bias: PatternBias;
  time: number;
  index: number;
  description: string;
};

type Geometry = {
  body: number;
  range: number;
  upper: number;
  lower: number;
  bullish: boolean;
  bearish: boolean;
};

const PATTERN_COPY: Record<string, { bias: PatternBias; description: string }> = {
  Doji: {
    bias: "neutral",
    description: "Open and close are almost equal — indecision. Wait for the next candle to confirm direction.",
  },
  Hammer: {
    bias: "bullish",
    description: "Small body, long lower wick after a decline. Buyers rejected lower prices; look for a follow-through green candle.",
  },
  "Inverted Hammer": {
    bias: "bullish",
    description: "Small body, long upper wick after a decline. A reversal hint — confirm with the next close higher.",
  },
  "Shooting Star": {
    bias: "bearish",
    description: "Small body, long upper wick after a rally. Sellers rejected the highs; confirm with a close lower.",
  },
  "Bullish Engulfing": {
    bias: "bullish",
    description: "A green candle fully covers the previous red body. Strong reversal signal after a downswing.",
  },
  "Bearish Engulfing": {
    bias: "bearish",
    description: "A red candle fully covers the previous green body. Strong reversal signal after an upswing.",
  },
  "Morning Star": {
    bias: "bullish",
    description: "Red candle, small indecision candle, then a strong green close. Three-bar bullish reversal.",
  },
  "Evening Star": {
    bias: "bearish",
    description: "Green candle, small indecision candle, then a strong red close. Three-bar bearish reversal.",
  },
  "Piercing Line": {
    bias: "bullish",
    description: "After a red candle, a green candle opens lower and closes above the midpoint of the prior body.",
  },
  "Dark Cloud Cover": {
    bias: "bearish",
    description: "After a green candle, a red candle opens higher and closes below the midpoint of the prior body.",
  },
  Harami: {
    bias: "neutral",
    description: "A small body sits inside the previous larger body — a pause. Bias comes from the prior trend and the next close.",
  },
  "Three White Soldiers": {
    bias: "bullish",
    description: "Three rising green candles with higher closes. Strong continuation of an uptrend.",
  },
  "Three Black Crows": {
    bias: "bearish",
    description: "Three falling red candles with lower closes. Strong continuation of a downtrend.",
  },
  Marubozu: {
    bias: "neutral",
    description: "Almost no wicks — the session opened and ran one way. Green is strong buying; red is strong selling.",
  },
};

function geom(c: CandleOHLC): Geometry {
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

function isDoji(g: Geometry): boolean {
  return g.body / g.range <= 0.12;
}

function push(
  out: DetectedPattern[],
  name: string,
  candle: CandleOHLC,
  index: number,
  biasOverride?: PatternBias,
) {
  const copy = PATTERN_COPY[name];
  if (!copy) return;
  out.push({
    id: `${name}:${candle.time}`,
    name,
    bias: biasOverride ?? copy.bias,
    time: candle.time,
    index,
    description: copy.description,
  });
}

/** Detects textbook candlestick patterns on closed OHLC bars for study annotations. */
export function detectCandlestickPatterns(candles: CandleOHLC[]): DetectedPattern[] {
  const found: DetectedPattern[] = [];
  if (candles.length < 1) return found;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const g = geom(c);
    const prev = i > 0 ? candles[i - 1] : null;
    const pg = prev ? geom(prev) : null;
    const prev2 = i > 1 ? candles[i - 2] : null;
    const p2g = prev2 ? geom(prev2) : null;

    if (isDoji(g) && g.range > 0) {
      push(found, "Doji", c, i);
    }

    const hammerish =
      g.lower >= g.body * 2 &&
      g.lower >= g.range * 0.5 &&
      g.upper <= g.lower * 0.4 &&
      Math.max(c.open, c.close) >= c.low + g.range * 0.55;
    if (hammerish && prev && pg?.bearish) {
      push(found, "Hammer", c, i);
    }

    const inverted =
      g.upper >= g.body * 2 &&
      g.upper >= g.range * 0.5 &&
      g.lower <= g.upper * 0.4 &&
      Math.min(c.open, c.close) <= c.high - g.range * 0.55;
    if (inverted && prev && pg?.bearish) {
      push(found, "Inverted Hammer", c, i);
    }
    if (inverted && prev && pg?.bullish) {
      push(found, "Shooting Star", c, i);
    }

    if (
      prev &&
      pg?.bearish &&
      g.bullish &&
      c.open <= prev.close &&
      c.close >= prev.open &&
      g.body > pg.body
    ) {
      push(found, "Bullish Engulfing", c, i);
    }

    if (
      prev &&
      pg?.bullish &&
      g.bearish &&
      c.open >= prev.close &&
      c.close <= prev.open &&
      g.body > pg.body
    ) {
      push(found, "Bearish Engulfing", c, i);
    }

    if (
      prev &&
      pg?.bearish &&
      g.bullish &&
      c.open < prev.low &&
      c.close > (prev.open + prev.close) / 2 &&
      c.close < prev.open
    ) {
      push(found, "Piercing Line", c, i);
    }

    if (
      prev &&
      pg?.bullish &&
      g.bearish &&
      c.open > prev.high &&
      c.close < (prev.open + prev.close) / 2 &&
      c.close > prev.open
    ) {
      push(found, "Dark Cloud Cover", c, i);
    }

    if (prev && pg && g.body < pg.body * 0.6) {
      const inside =
        Math.max(c.open, c.close) <= Math.max(prev.open, prev.close) &&
        Math.min(c.open, c.close) >= Math.min(prev.open, prev.close);
      if (inside && !isDoji(pg)) {
        push(found, "Harami", c, i, pg.bullish ? "bearish" : "bullish");
      }
    }

    if (g.upper / g.range < 0.08 && g.lower / g.range < 0.08 && g.body / g.range > 0.85) {
      push(found, "Marubozu", c, i, g.bullish ? "bullish" : "bearish");
    }

    if (prev && prev2 && p2g && pg) {
      const morning =
        p2g.bearish &&
        pg.body < p2g.body * 0.5 &&
        g.bullish &&
        c.close > (prev2.open + prev2.close) / 2;
      if (morning) push(found, "Morning Star", c, i);

      const evening =
        p2g.bullish &&
        pg.body < p2g.body * 0.5 &&
        g.bearish &&
        c.close < (prev2.open + prev2.close) / 2;
      if (evening) push(found, "Evening Star", c, i);
    }

    if (i >= 2 && prev && prev2) {
      const a = geom(prev2);
      const b = geom(prev);
      const soldiers =
        a.bullish &&
        b.bullish &&
        g.bullish &&
        prev2.close < prev.close &&
        prev.close < c.close &&
        prev.open >= prev2.open &&
        c.open >= prev.open;
      if (soldiers) push(found, "Three White Soldiers", c, i);

      const crows =
        a.bearish &&
        b.bearish &&
        g.bearish &&
        prev2.close > prev.close &&
        prev.close > c.close &&
        prev.open <= prev2.open &&
        c.open <= prev.open;
      if (crows) push(found, "Three Black Crows", c, i);
    }
  }

  // Prefer the most specific label when several fire on the same bar.
  const rank: Record<string, number> = {
    "Morning Star": 10,
    "Evening Star": 10,
    "Three White Soldiers": 9,
    "Three Black Crows": 9,
    "Bullish Engulfing": 8,
    "Bearish Engulfing": 8,
    "Piercing Line": 7,
    "Dark Cloud Cover": 7,
    Hammer: 6,
    "Shooting Star": 6,
    "Inverted Hammer": 5,
    Harami: 4,
    Marubozu: 3,
    Doji: 2,
  };

  const best = new Map<number, DetectedPattern>();
  for (const p of found) {
    const current = best.get(p.time);
    if (!current || (rank[p.name] ?? 0) > (rank[current.name] ?? 0)) {
      best.set(p.time, p);
    }
  }

  return [...best.values()].sort((a, b) => a.time - b.time);
}

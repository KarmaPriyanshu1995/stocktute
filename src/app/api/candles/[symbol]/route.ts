import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Candle, TIMEFRAMES, type Timeframe } from "@/models/Candle";
import { generateHistory } from "@/lib/priceFeed/generateHistory";
import { LAG_DAYS } from "@/config/education";
import { clampCandlesToLag, lagCutoffUnix } from "@/lib/compliance/dataLag";

const MIN_STUDY_BARS = 80;

function serialize(
  candles: Array<{ time: number; open: number; high: number; low: number; close: number; volume?: number }>,
) {
  return candles.map((c) => ({
    time: c.time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume ?? 0,
  }));
}

function isStudyReady(
  candles: Array<{ open: number; high: number; low: number; close: number }>,
): boolean {
  if (candles.length < MIN_STUDY_BARS) return false;
  const withBodies = candles.filter((c) => {
    const range = c.high - c.low;
    if (range <= 0) return false;
    return Math.abs(c.close - c.open) / range > 0.12;
  }).length;
  return withBodies >= candles.length * 0.35;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const { searchParams } = new URL(req.url);
  const upper = symbol.toUpperCase();

  const timeframe = (searchParams.get("timeframe") ?? "15m") as Timeframe;
  if (!TIMEFRAMES.includes(timeframe)) {
    return NextResponse.json({ error: `timeframe must be one of ${TIMEFRAMES.join(", ")}` }, { status: 400 });
  }

  const limit = Math.min(Number(searchParams.get("limit") ?? 500), 2000);
  const cutoffMs = lagCutoffUnix() * 1000;
  const fallback = clampCandlesToLag(generateHistory(upper, timeframe, Math.min(limit, 240), cutoffMs));

  try {
    await connectToDatabase();
    const candles = await Candle.find({ symbol: upper, timeframe })
      .sort({ time: -1 })
      .limit(limit)
      .lean();

    const stored = clampCandlesToLag(serialize(candles.reverse()));
    const fromDb = isStudyReady(stored);
    const lagged = fromDb ? stored : fallback;

    if (lagged.length === 0) {
      return NextResponse.json(
        { error: "educational_lag", lagDays: LAG_DAYS, isSynthetic: true },
        { status: 422 },
      );
    }

    return NextResponse.json({
      symbol: upper,
      timeframe,
      source: fromDb ? "db" : "generated",
      isSynthetic: true,
      lagDays: LAG_DAYS,
      candles: lagged,
    });
  } catch (error) {
    console.error("[candles] falling back to generated history", error);
    if (fallback.length === 0) {
      return NextResponse.json(
        { error: "educational_lag", lagDays: LAG_DAYS, isSynthetic: true },
        { status: 422 },
      );
    }
    return NextResponse.json({
      symbol: upper,
      timeframe,
      source: "generated",
      isSynthetic: true,
      lagDays: LAG_DAYS,
      candles: fallback,
    });
  }
}

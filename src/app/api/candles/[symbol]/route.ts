import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { Candle, TIMEFRAMES, type Timeframe } from "@/models/Candle";
import { generateHistory } from "@/lib/priceFeed/generateHistory";

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
  const fallback = generateHistory(upper, timeframe, Math.min(limit, 240));

  try {
    await connectToDatabase();
    const candles = await Candle.find({ symbol: upper, timeframe })
      .sort({ time: -1 })
      .limit(limit)
      .lean();

    const stored = serialize(candles.reverse());
    return NextResponse.json({
      symbol: upper,
      timeframe,
      source: isStudyReady(stored) ? "db" : "generated",
      candles: isStudyReady(stored) ? stored : fallback,
    });
  } catch (error) {
    console.error("[candles] falling back to generated history", error);
    return NextResponse.json({
      symbol: upper,
      timeframe,
      source: "generated",
      candles: fallback,
    });
  }
}

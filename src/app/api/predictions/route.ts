import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/mongoose";
import { resolveTeachingChart } from "@/lib/journal/teachingCharts";
import { scorePrediction } from "@/lib/journal/score";
import { Prediction } from "@/models/Prediction";
import { MistakeJournalEntry } from "@/models/MistakeJournalEntry";

const bodySchema = z.object({
  chartKey: z.string().min(3).max(120),
  direction: z.enum(["up", "down", "sideways"]),
  confidence: z.number().min(50).max(100),
  reason: z.string().trim().min(8).max(500),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Direction, 50–100% confidence, and a short reason are required" }, { status: 400 });
  }

  const chart = resolveTeachingChart(parsed.data.chartKey);
  if (!chart) {
    return NextResponse.json({ error: "Unknown teaching chart" }, { status: 404 });
  }

  const confidence = Math.round(parsed.data.confidence);
  const scored = scorePrediction({
    direction: parsed.data.direction,
    reason: parsed.data.reason,
    setup: chart.setup,
  });

  try {
    await connectToDatabase();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const snapshot = { candles: chart.candles, setup: chart.setup };

    const prediction = await Prediction.findOneAndUpdate(
      { user: userId, chartKey: chart.chartKey },
      {
        $set: {
          source: chart.source,
          symbol: chart.symbol,
          timeframe: chart.timeframe,
          patternName: chart.setup.name,
          direction: parsed.data.direction,
          confidence,
          reason: parsed.data.reason,
          actual: scored.actual,
          closeReturnPct: scored.closeReturnPct,
          matched: scored.matched,
          tags: scored.tags,
          snapshot,
          user: userId,
          chartKey: chart.chartKey,
        },
      },
      { upsert: true, new: true },
    );

    if (scored.matched === false && scored.actual) {
      await MistakeJournalEntry.findOneAndUpdate(
        { user: userId, chartKey: chart.chartKey },
        {
          $set: {
            user: userId,
            chartKey: chart.chartKey,
            prediction: prediction._id,
            symbol: chart.symbol,
            timeframe: chart.timeframe,
            patternName: chart.setup.name,
            direction: parsed.data.direction,
            confidence,
            reason: parsed.data.reason,
            actual: scored.actual,
            closeReturnPct: scored.closeReturnPct,
            tags: scored.tags,
            snapshot,
          },
        },
        { upsert: true },
      );
    } else {
      await MistakeJournalEntry.deleteOne({ user: userId, chartKey: chart.chartKey });
    }

    return NextResponse.json({
      ok: true,
      matched: scored.matched,
      actual: scored.actual,
      closeReturnPct: scored.closeReturnPct,
      tags: scored.tags,
      journaled: scored.matched === false,
    });
  } catch (error) {
    console.error("[predictions] save failed", error);
    return NextResponse.json({ error: "Could not save prediction" }, { status: 503 });
  }
}

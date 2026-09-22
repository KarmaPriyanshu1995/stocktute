import { auth } from "@/auth";
import { JournalClient, type JournalEntryView } from "@/components/learn/JournalClient";
import { summarizeHabits } from "@/lib/journal/score";
import { connectToDatabase } from "@/lib/db/mongoose";
import { MistakeJournalEntry } from "@/models/MistakeJournalEntry";
import type { DetectedSetup, ExpectedMove, Ohlcv } from "@/lib/detection/types";

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    await connectToDatabase();
    const rows = await MistakeJournalEntry.find({ user: session.user.id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const entries: JournalEntryView[] = rows.map((row) => ({
      id: String(row._id),
      chartKey: row.chartKey,
      symbol: row.symbol,
      timeframe: row.timeframe,
      patternName: row.patternName,
      direction: row.direction as ExpectedMove,
      confidence: row.confidence,
      reason: row.reason,
      actual: row.actual as ExpectedMove,
      closeReturnPct: row.closeReturnPct ?? null,
      tags: row.tags ?? [],
      createdAt: (row.updatedAt ?? row.createdAt)?.toISOString?.() ?? new Date().toISOString(),
      snapshot: {
        candles: (row.snapshot?.candles ?? []) as Ohlcv[],
        setup: row.snapshot.setup as DetectedSetup,
      },
    }));

    return <JournalClient entries={entries} habits={summarizeHabits(entries)} />;
  } catch {
    return <JournalClient entries={[]} habits={[]} dbError />;
  }
}

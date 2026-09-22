import { requireAdmin } from "@/lib/auth/requireAdmin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DailyChapter } from "@/models/DailyChapter";
import { ChapterReview, type ChapterView } from "@/components/admin/ChapterReview";
import { DISCLAIMER } from "@/lib/daily/compliance";
import type { BuiltSection } from "@/lib/daily/copy";
import type { ComplianceHit } from "@/lib/daily/compliance";
import Link from "next/link";

export default async function ChapterPage({ params }: { params: Promise<{ date: string }> }) {
  await requireAdmin();
  const { date } = await params;

  try {
    await connectToDatabase();
    const doc = await DailyChapter.findOne({ date }).lean();
    if (!doc) {
      return (
        <div>
          <p className="text-sm text-text-secondary">No chapter for {date}.</p>
          <Link href="/admin" className="text-xs text-accent">
            Back
          </Link>
        </div>
      );
    }
    const chapter: ChapterView = {
      date: doc.date,
      status: doc.status,
      autoPublish: doc.autoPublish,
      source: doc.source,
      disclaimer: doc.disclaimer ?? DISCLAIMER,
      sections: (doc.sections ?? []) as BuiltSection[],
      compliance: {
        blockedCount: doc.compliance?.blockedCount ?? 0,
        hits: (doc.compliance?.hits ?? []) as ComplianceHit[],
      },
      reviewNote: doc.reviewNote ?? "",
    };
    return <ChapterReview chapter={chapter} />;
  } catch {
    return <p className="text-sm text-text-secondary">Database unavailable.</p>;
  }
}

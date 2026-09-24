import { requireAdmin } from "@/lib/auth/requireAdmin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DailyChapter } from "@/models/DailyChapter";
import { ChapterReview, type ChapterView } from "@/components/admin/ChapterReview";
import { DISCLAIMER, type ComplianceFlag } from "@/lib/daily/compliance";
import type { BuiltSection } from "@/lib/daily/copy";
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
    const flags = ((doc.compliance?.flags ?? doc.compliance?.hits ?? []) as ComplianceFlag[]);
    const chapter: ChapterView = {
      date: doc.date,
      sessionDate: doc.sessionDate,
      status: doc.status,
      autoPublish: doc.autoPublish,
      source: doc.source,
      isSynthetic: doc.isSynthetic ?? true,
      disclaimer: doc.disclaimer ?? DISCLAIMER,
      sections: (doc.sections ?? []) as BuiltSection[],
      compliance: {
        blockedCount: doc.compliance?.blockedCount ?? 0,
        flags,
        hits: flags,
      },
      reviewNote: doc.reviewNote ?? "",
    };
    return <ChapterReview chapter={chapter} />;
  } catch {
    return <p className="text-sm text-text-secondary">Database unavailable.</p>;
  }
}

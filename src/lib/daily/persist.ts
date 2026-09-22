import { connectToDatabase } from "@/lib/db/mongoose";
import { generateDailyChapter, type BuiltChapter } from "@/lib/daily/generate";
import { AppSettings } from "@/models/AppSettings";
import { ComplianceEvent } from "@/models/ComplianceEvent";
import { DailyChapter } from "@/models/DailyChapter";

export async function persistGeneratedChapter(
  date: string,
  opts: { force?: boolean; actorId?: string | null } = {},
) {
  const result = generateDailyChapter(date);
  if (!result.ok) {
    return { skipped: true as const, reason: result.skipped };
  }

  await connectToDatabase();
  const settings = await AppSettings.findOneAndUpdate(
    { key: "site" },
    { $setOnInsert: { key: "site", autoPublishDaily: false } },
    { upsert: true, new: true },
  );
  const autoPublish = settings?.autoPublishDaily ?? false;
  const existing = await DailyChapter.findOne({ date }).lean();
  if (existing && existing.status === "published" && !opts.force) {
    return { skipped: true as const, reason: "published" as const, date };
  }

  const status =
    autoPublish && result.chapter.compliance.blockedCount === 0 ? "published" : "draft";

  const chapter = await DailyChapter.findOneAndUpdate(
    { date },
    {
      $set: {
        status,
        autoPublish,
        source: result.chapter.source,
        disclaimer: result.chapter.disclaimer,
        sections: result.chapter.sections,
        compliance: result.chapter.compliance,
        generatedAt: new Date(),
        reviewer: undefined,
        reviewedAt: undefined,
        reviewNote: "",
      },
    },
    { upsert: true, new: true },
  );

  if (result.chapter.compliance.hits.length > 0) {
    await ComplianceEvent.insertMany(
      result.chapter.compliance.hits.map((hit) => ({
        chapterDate: date,
        sectionId: "chapter",
        phrase: hit.phrase,
        original: hit.original,
        rewritten: hit.rewritten,
      })),
    );
  }

  return { skipped: false as const, chapter: toPlain(chapter), autoPublish };
}

export function toPlain(doc: {
  date: string;
  status: string;
  autoPublish: boolean;
  source: string;
  disclaimer: string;
  sections: BuiltChapter["sections"];
  compliance: BuiltChapter["compliance"];
  reviewNote?: string | null;
  generatedAt?: Date;
  reviewedAt?: Date | null;
  updatedAt?: Date;
}) {
  return {
    date: doc.date,
    status: doc.status,
    autoPublish: doc.autoPublish,
    source: doc.source,
    disclaimer: doc.disclaimer,
    sections: doc.sections,
    compliance: doc.compliance,
    reviewNote: doc.reviewNote ?? "",
    generatedAt: doc.generatedAt?.toISOString() ?? null,
    reviewedAt: doc.reviewedAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

import { connectToDatabase } from "@/lib/db/mongoose";
import { chapterPublishStatus, generateDailyChapter, type BuiltChapter } from "@/lib/daily/generate";
import { AppSettings } from "@/models/AppSettings";
import { ComplianceEvent } from "@/models/ComplianceEvent";
import { DailyChapter } from "@/models/DailyChapter";

export { chapterPublishStatus };

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

  const status = chapterPublishStatus(result.chapter, autoPublish);

  const chapter = await DailyChapter.findOneAndUpdate(
    { date },
    {
      $set: {
        status,
        sessionDate: result.chapter.sessionDate,
        autoPublish,
        source: result.chapter.source,
        isSynthetic: result.chapter.isSynthetic,
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

  if (result.chapter.compliance.flags.length > 0) {
    await ComplianceEvent.insertMany(
      result.chapter.compliance.flags.map((flag) => ({
        chapterDate: date,
        sectionId: "chapter",
        phrase: flag.phrase,
        original: flag.original,
        suggestion: flag.suggestion,
        rewritten: flag.suggestion,
        resolved: false,
      })),
    );
  }

  return { skipped: false as const, chapter: toPlain(chapter), autoPublish };
}

export function toPlain(doc: {
  date: string;
  sessionDate?: string | null;
  status: string;
  autoPublish: boolean;
  source: string;
  isSynthetic?: boolean;
  disclaimer: string;
  sections: BuiltChapter["sections"];
  compliance?: {
    blockedCount?: number;
    flags?: BuiltChapter["compliance"]["flags"];
    hits?: BuiltChapter["compliance"]["flags"];
  };
  reviewNote?: string | null;
  generatedAt?: Date;
  reviewedAt?: Date | null;
  updatedAt?: Date;
}) {
  const flags = doc.compliance?.flags ?? doc.compliance?.hits ?? [];
  return {
    date: doc.date,
    sessionDate: doc.sessionDate ?? doc.date,
    status: doc.status,
    autoPublish: doc.autoPublish,
    source: doc.source,
    isSynthetic: doc.isSynthetic ?? true,
    disclaimer: doc.disclaimer,
    sections: doc.sections,
    compliance: {
      blockedCount: doc.compliance?.blockedCount ?? 0,
      flags,
      hits: flags,
    },
    reviewNote: doc.reviewNote ?? "",
    generatedAt: doc.generatedAt?.toISOString() ?? null,
    reviewedAt: doc.reviewedAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  };
}

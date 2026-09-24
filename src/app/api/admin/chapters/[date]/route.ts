import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/mongoose";
import { filterParagraphs, unresolvedFlagCount, type ComplianceFlag } from "@/lib/daily/compliance";
import { toPlain } from "@/lib/daily/persist";
import { DailyChapter } from "@/models/DailyChapter";
import { ComplianceEvent } from "@/models/ComplianceEvent";

const bodySchema = z.object({
  action: z.enum(["save", "approve", "reject", "publish", "resolve-flag"]),
  reviewNote: z.string().max(2000).optional(),
  paragraphs: z.record(z.string(), z.array(z.string())).optional(),
  flagIndex: z.number().int().min(0).optional(),
  resolution: z.enum(["rewritten", "accepted", "dismissed"]).optional(),
});

function chapterFlags(chapter: { compliance?: { flags?: ComplianceFlag[]; hits?: ComplianceFlag[] } }): ComplianceFlag[] {
  return (chapter.compliance?.flags ?? chapter.compliance?.hits ?? []) as ComplianceFlag[];
}

export async function PATCH(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin" || !session.user.id) {
    return NextResponse.json({ error: "Admin required" }, { status: 401 });
  }

  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const chapter = await DailyChapter.findOne({ date });
    if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let flags = chapterFlags(chapter);

    if (parsed.data.paragraphs) {
      const nextFlags: ComplianceFlag[] = [];
      chapter.sections = chapter.sections.map((section) => {
        const next = parsed.data.paragraphs?.[section.id];
        if (!next) return section;
        const filtered = filterParagraphs(next);
        nextFlags.push(...filtered.flags.map((h) => ({ ...h, sectionId: section.id })));
        return { ...section, paragraphs: filtered.paragraphs };
      });
      flags = nextFlags;
      if (nextFlags.length > 0) {
        await ComplianceEvent.insertMany(
          nextFlags.map((hit) => ({
            chapterDate: date,
            sectionId: "sectionId" in hit ? String((hit as { sectionId?: string }).sectionId ?? "chapter") : "chapter",
            phrase: hit.phrase,
            original: hit.original,
            suggestion: hit.suggestion,
            rewritten: hit.suggestion,
            resolved: false,
          })),
        );
      }
    }

    if (parsed.data.action === "resolve-flag") {
      const idx = parsed.data.flagIndex;
      if (idx == null || !flags[idx]) {
        return NextResponse.json({ error: "Unknown flag" }, { status: 400 });
      }
      flags[idx] = {
        ...flags[idx],
        resolved: true,
        resolution: parsed.data.resolution ?? "accepted",
      };
    }

    const blockedCount = unresolvedFlagCount(flags);
    chapter.compliance = { blockedCount, flags, hits: flags };

    if (parsed.data.reviewNote !== undefined) chapter.reviewNote = parsed.data.reviewNote;
    chapter.reviewer = new mongoose.Types.ObjectId(session.user.id);
    chapter.reviewedAt = new Date();

    if (parsed.data.action === "approve" || parsed.data.action === "publish") {
      if (blockedCount > 0) {
        return NextResponse.json(
          { error: "Unresolved compliance flags", blockedCount },
          { status: 403 },
        );
      }
    }

    if (parsed.data.action === "reject") chapter.status = "rejected";
    else if (parsed.data.action === "publish" || (parsed.data.action === "approve" && chapter.autoPublish)) {
      chapter.status = "published";
    } else if (parsed.data.action === "approve") {
      chapter.status = "approved";
    }

    await chapter.save();
    return NextResponse.json({ ok: true, chapter: toPlain(chapter.toObject()) });
  } catch (error) {
    console.error("[daily-chapter] review failed", error);
    return NextResponse.json({ error: "Could not update chapter" }, { status: 503 });
  }
}

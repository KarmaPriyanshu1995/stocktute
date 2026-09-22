import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeChapterJob } from "@/lib/auth/requireAdmin";
import { formatIstDate } from "@/lib/daily/calendar";
import { persistGeneratedChapter } from "@/lib/daily/persist";

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  force: z.boolean().optional(),
});

export async function POST(req: Request) {
  const authz = await authorizeChapterJob(req);
  if (!authz) {
    return NextResponse.json({ error: "Admin or cron secret required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const date = parsed.data.date ?? formatIstDate();
  try {
    const result = await persistGeneratedChapter(date, {
      force: parsed.data.force,
      actorId: authz.userId,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[daily-chapter] generate failed", error);
    return NextResponse.json({ error: "Could not generate chapter" }, { status: 503 });
  }
}

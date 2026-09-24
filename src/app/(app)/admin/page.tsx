import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { DailyChapter } from "@/models/DailyChapter";
import { AppSettings } from "@/models/AppSettings";
import { formatIstDate } from "@/lib/daily/calendar";
import { AdminGenerate } from "@/components/admin/AdminGenerate";

export default async function AdminPage() {
  await requireAdmin();
  let chapters: Array<{ date: string; status: string; compliance?: { blockedCount?: number } }> = [];
  let autoPublishDaily = false;
  try {
    await connectToDatabase();
    chapters = await DailyChapter.find().sort({ date: -1 }).limit(30).lean();
    const settings = await AppSettings.findOne({ key: "site" }).lean();
    autoPublishDaily = Boolean(settings?.autoPublishDaily);
  } catch {
    chapters = [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Daily chapter review</h1>
        <p className="text-sm text-text-secondary">
          Generate after the 15:30 IST close (~18:00 job). Drafts stay off the student feed until a
          content partner approves them. Today IST: {formatIstDate()}.
        </p>
      </div>

      <AdminGenerate autoPublishDaily={autoPublishDaily} />

      <section className="rounded-lg border border-bg-border bg-bg-raised">
        {chapters.length === 0 ? (
          <p className="p-5 text-sm text-text-secondary">No chapters yet. Generate a draft for a trading day.</p>
        ) : (
          <ul>
            {chapters.map((c) => (
              <li key={c.date} className="border-b border-bg-border last:border-0">
                <Link
                  href={`/admin/chapters/${c.date}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-bg-surface-hover"
                >
                  <span className="font-mono text-sm text-text-primary">{c.date}</span>
                  <span className="text-xs text-text-tertiary">
                    {c.status}
                    {(c.compliance?.blockedCount ?? 0) > 0
                      ? ` · ${c.compliance?.blockedCount} compliance flags`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

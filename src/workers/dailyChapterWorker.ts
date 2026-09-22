/**
 * After-close daily chapter job (~18:00 IST). Skips weekends and NSE holidays.
 * Run: npx tsx src/workers/dailyChapterWorker.ts
 * Or POST /api/admin/chapters/generate with Authorization: Bearer $CRON_SECRET
 */
import "dotenv/config";
import { formatIstDate } from "@/lib/daily/calendar";
import { persistGeneratedChapter } from "@/lib/daily/persist";

async function main() {
  const date = process.argv[2] || formatIstDate();
  const result = await persistGeneratedChapter(date);
  if (result.skipped) {
    console.log(`[daily-chapter] skipped ${date}: ${result.reason}`);
    return;
  }
  console.log(
    `[daily-chapter] saved ${result.chapter.date} status=${result.chapter.status} sections=${result.chapter.sections.length} compliance=${result.chapter.compliance.blockedCount}`,
  );
}

main().catch((error) => {
  console.error("[daily-chapter] failed", error);
  process.exit(1);
});

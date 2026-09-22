import { cn } from "@/lib/utils";
import type { LessonStatus } from "@/lib/curriculum/types";

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        status === "published"
          ? "border-accent/40 text-accent"
          : "border-bg-border text-text-tertiary",
      )}
    >
      {status === "published" ? "Open" : "Locked"}
    </span>
  );
}

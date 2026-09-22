import type { PatternWorkbook } from "@/lib/curriculum/types";

const ROWS: Array<[keyof PatternWorkbook, string]> = [
  ["definition", "Definition"],
  ["psychology", "Market psychology"],
  ["meaning", "Bullish or bearish meaning"],
  ["trend", "Trend requirement"],
  ["volume", "Volume confirmation"],
  ["entry", "Entry conditions"],
  ["stop", "Stop-loss placement"],
  ["target", "Target calculation"],
  ["invalidation", "Pattern invalidation"],
  ["success", "Successful example"],
  ["failed", "Failed example"],
  ["exercise", "Interactive chart exercise"],
];

export function PatternWorkbookView({ pattern }: { pattern: PatternWorkbook }) {
  return (
    <div className="flex flex-col gap-4">
      {ROWS.map(([key, label]) => (
        <section key={key}>
          <h3 className="text-xs uppercase tracking-wide text-text-tertiary">{label}</h3>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{pattern[key]}</p>
        </section>
      ))}
      <section>
        <h3 className="text-xs uppercase tracking-wide text-text-tertiary">Formation rules</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {pattern.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
      <p className="rounded-md border border-bg-border bg-bg-surface px-3 py-2 text-xs text-text-tertiary">
        Quiz yourself in Drills after you can explain the failed example out loud. A pattern is not a
        guaranteed signal.
      </p>
    </div>
  );
}

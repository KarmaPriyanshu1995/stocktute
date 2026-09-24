import { t, type Locale } from "@/lib/i18n";

type Props = {
  show?: boolean;
  language?: Locale;
};

export function DemoDataBadge({ show = true, language = "en" }: Props) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center rounded-md border border-bg-border bg-bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
      {t(language, "badge.demo")}
    </span>
  );
}

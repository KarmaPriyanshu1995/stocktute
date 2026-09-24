import { en, type MessageKey } from "./en";
import { hi, hiNeedsHumanReview } from "./hi";
import { hinglish, hinglishNeedsHumanReview } from "./hinglish";
import type { Locale } from "./types";

export type { Locale, MessageKey };
export { isLocale } from "./types";

const TABLES: Record<Locale, Record<MessageKey, string>> = { en, hi, hinglish };

export function t(lang: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const table = TABLES[lang] ?? en;
  let text = table[key] ?? en[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function needsHumanReview(lang: Locale, _key?: MessageKey): boolean {
  if (lang === "en") return false;
  if (lang === "hi") return hiNeedsHumanReview;
  return hinglishNeedsHumanReview;
}

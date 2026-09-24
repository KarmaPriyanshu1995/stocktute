export type Locale = "en" | "hi" | "hinglish";

export const LOCALES: Locale[] = ["en", "hi", "hinglish"];

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "hi" || value === "hinglish";
}

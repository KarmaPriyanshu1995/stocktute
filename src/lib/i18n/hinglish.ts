import { en, type MessageKey } from "./en";

/** TODO: human Hinglish pass. English fallback until reviewed. */
export const hinglish: Record<MessageKey, string> = { ...en };

export const hinglishNeedsHumanReview = true;

export type ComplianceFlag = {
  phrase: string;
  original: string;
  suggestion: string;
  resolved: boolean;
  resolution?: "rewritten" | "accepted" | "dismissed";
};

type Rule = {
  phrase: string;
  pattern: RegExp;
  suggestion: string;
};

/**
 * Flags risky phrases for human rewrite. Does not silently replace words.
 * Psychology words ("buyers", "sellers") are allowed.
 */
const RULES: Rule[] = [
  { phrase: "sure-shot", pattern: /sure[\s-]?shot/gi, suggestion: "study case" },
  { phrase: "guaranteed", pattern: /\bguaranteed\b/gi, suggestion: "not promised" },
  { phrase: "will go up", pattern: /\bwill go up\b/gi, suggestion: "moved in the textbook direction in past samples" },
  { phrase: "will go down", pattern: /\bwill go down\b/gi, suggestion: "moved in the textbook direction in past samples" },
  { phrase: "multibagger", pattern: /\bmultibaggers?\b/gi, suggestion: "study example" },
  { phrase: "book profit", pattern: /\bbook profits?\b/gi, suggestion: "review the invalidation" },
  { phrase: "target", pattern: /\btargets?\b/gi, suggestion: "reference level" },
  { phrase: "buy", pattern: /\bbuy\b/gi, suggestion: "study" },
  { phrase: "sell", pattern: /\bsell\b/gi, suggestion: "study" },
  { phrase: "accumulate", pattern: /\baccumulate\b/gi, suggestion: "watch" },
];

export function filterParagraph(text: string): { text: string; flags: ComplianceFlag[] } {
  const flags: ComplianceFlag[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(text)) {
      rule.pattern.lastIndex = 0;
      continue;
    }
    rule.pattern.lastIndex = 0;
    flags.push({
      phrase: rule.phrase,
      original: text,
      suggestion: rule.suggestion,
      resolved: false,
    });
  }
  return { text, flags };
}

export function filterParagraphs(paragraphs: string[]): {
  paragraphs: string[];
  flags: ComplianceFlag[];
} {
  const out: string[] = [];
  const flags: ComplianceFlag[] = [];
  for (const p of paragraphs) {
    const filtered = filterParagraph(p);
    out.push(filtered.text);
    flags.push(...filtered.flags);
  }
  return { paragraphs: out, flags };
}

export function unresolvedFlagCount(flags: ComplianceFlag[]): number {
  return flags.filter((f) => !f.resolved).length;
}

/** @deprecated Use ComplianceFlag. Kept so older logs still type-check while migrating. */
export type ComplianceHit = ComplianceFlag & { rewritten?: string };

export const DISCLAIMER =
  "Educational content only. Not investment advice. Past patterns do not guarantee future results.";

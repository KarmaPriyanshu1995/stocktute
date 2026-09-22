export type ComplianceHit = {
  phrase: string;
  original: string;
  rewritten: string;
};

type Rule = {
  phrase: string;
  pattern: RegExp;
  replace: string;
};

/**
 * Runs on every generated (or admin-edited) paragraph before save.
 * Psychology words like "buyers" / "sellers" are allowed; live-trade
 * advice and certainty claims are rewritten.
 */
const RULES: Rule[] = [
  { phrase: "sure-shot", pattern: /sure[\s-]?shot/gi, replace: "study case" },
  { phrase: "guaranteed", pattern: /\bguaranteed\b/gi, replace: "not promised" },
  { phrase: "will go up", pattern: /\bwill go up\b/gi, replace: "moved in the textbook direction in past samples" },
  { phrase: "will go down", pattern: /\bwill go down\b/gi, replace: "moved in the textbook direction in past samples" },
  { phrase: "multibagger", pattern: /\bmultibaggers?\b/gi, replace: "study example" },
  { phrase: "book profit", pattern: /\bbook profits?\b/gi, replace: "review the invalidation" },
  { phrase: "target", pattern: /\btargets?\b/gi, replace: "reference level" },
  { phrase: "buy", pattern: /\bbuy\b/gi, replace: "study" },
  { phrase: "sell", pattern: /\bsell\b/gi, replace: "study" },
  { phrase: "accumulate", pattern: /\baccumulate\b/gi, replace: "watch" },
];

export function filterParagraph(text: string): { text: string; hits: ComplianceHit[] } {
  let next = text;
  const hits: ComplianceHit[] = [];
  for (const rule of RULES) {
    if (!rule.pattern.test(next)) {
      rule.pattern.lastIndex = 0;
      continue;
    }
    rule.pattern.lastIndex = 0;
    const original = next;
    next = next.replace(rule.pattern, rule.replace);
    hits.push({ phrase: rule.phrase, original, rewritten: next });
  }
  return { text: next, hits };
}

export function filterParagraphs(paragraphs: string[]): {
  paragraphs: string[];
  hits: ComplianceHit[];
} {
  const out: string[] = [];
  const hits: ComplianceHit[] = [];
  for (const p of paragraphs) {
    const filtered = filterParagraph(p);
    out.push(filtered.text);
    hits.push(...filtered.hits);
  }
  return { paragraphs: out, hits };
}

export const DISCLAIMER =
  "Educational content only. Not investment advice. Past patterns do not guarantee future results.";

# Stocktute — Project Rules (read before every task)

## What this product is
Stocktute is an Indian stock market (NSE/BSE) EDUCATION platform. Students learn and practise
with virtual money only. It never gives real buy/sell advice, stock tips, targets, or profit
promises. A 12-level curriculum gates content; F&O (Level 10) stays locked until the Level 6
risk test is passed.

Stack: Next.js 15 App Router, React 19, TypeScript (strict), MongoDB/Mongoose 9, NextAuth v5,
Upstash Redis, TradingView Lightweight Charts v5, Tailwind 4 with tokens in src/styles/tokens.ts,
Vitest, tsx workers. Read docs/Stocktute-Project-Guide.pdf context in this file, not old
docs/phase1-architecture.md, which is partly superseded.

## Non-negotiable architecture rules
1. CODE DETECTS, LANGUAGE EXPLAINS. Patterns, indicators, levels, outcomes and base rates are
   computed only by deterministic code (src/lib/detection → ChartFacts). Any LLM or template
   only explains ChartFacts. If a value is missing, output "I don't have that data." Never
   invent prices, patterns, statistics or news.
2. SEBI 30-DAY RULE. Any named security shown in teaching content (lessons, daily chapter,
   classroom, replay, rule checks, quizzes) must use market data at least 30 calendar days old.
   Enforce this in one central guard function, not per page. Hidden-name "blind mode" does not
   remove this requirement.
3. NO LOOKAHEAD. Signals computed on a bar's close execute at the next bar's open. Any
   indicator or strategy that reads future bars must be rejected with a clear error.
4. HONEST DATA LABELS. Synthetic or fixture data must carry isSynthetic: true through the whole
   pipeline and render a visible "Demo data" badge. Synthetic base rates are never shown as
   historical statistics. Auto-publish is impossible while any section uses synthetic data.
5. COMPLIANCE. All generated or user-facing teaching text passes src/lib/daily/compliance.ts.
   The filter FLAGS risky phrases for human rewrite; it does not silently replace words.
   Psychology words ("buyers", "sellers") are allowed.
6. STRATEGY STRUCTURE. Every saved strategy must have entry, exit, stop-loss and a
   position-sizing rule. Reject saves missing any of them.
7. SAFE USER CODE. Never eval or run user JavaScript on the server. User formulas use our own
   parsed DSL. User Python runs only in the browser via Pyodide in a Web Worker with time and
   memory limits.
8. SECURITY. Server never trusts client prices or scores. Validate every API input with zod.
   Admin routes call requireAdmin(). Secrets stay in env.

## How to work
- Before coding: read the relevant files, then write a short plan (files to touch, data model
  changes, tests to add, risks). Wait for approval on anything that changes a Mongo schema or
  deletes code.
- Work in small, reviewable steps. One concern per commit, conventional commit messages.
- Every behaviour change gets Vitest tests. All existing tests must stay green; run npm test
  before reporting done.
- No new dependency without a one-line justification (size, licence, why not built-in).
  Prefer free and open-source.
- TypeScript strict, no `any` without a comment explaining why. Reuse existing components
  (LightweightChart, PatternReplay, ComplianceBanner) before creating new ones.
- Keep all fees, thresholds and rates (brokerage, STT, GST, stamp duty, lag days, ATR bands)
  in typed config files, never hard-coded in logic.
- Every student-facing string supports en / hi / hinglish via the i18n layer.
- Mobile-first UI, accessible (keyboard, contrast, aria labels), light and dark themes.

## Report format after each task
1. What changed (files, short reason each)
2. Tests added and full test result
3. Assumptions made
4. Anything I must decide or configure (keys, data, legal review)
5. Suggested next step
import Link from "next/link";

const REQUIRED = [
  "Strategy name and description",
  "Market and instrument universe",
  "Timeframe",
  "Entry conditions",
  "Exit conditions",
  "Stop-loss rule",
  "Profit-target rule",
  "Position-sizing rule",
  "Maximum open positions",
  "Maximum daily loss",
  "Trading costs and slippage",
  "Market-condition filter",
  "Backtesting period",
];

const WARNINGS = [
  "No stop loss is defined",
  "Position size is missing",
  "Entry conditions contradict each other",
  "The strategy uses future data",
  "Too many similar indicators",
  "Risk is too high",
  "The formula is over-optimized",
];

export default function FormulasPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Formula Builder</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Preview of the no-code builder. Every saved strategy will be required to include a stop and
          a size rule. The AI will translate rules into plain language — it will not certify a
          strategy as profitable.
        </p>
      </div>

      <section className="rounded-lg border border-bg-border bg-bg-raised p-5">
        <h2 className="text-sm font-medium text-text-primary">Example (educational)</h2>
        <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
{`ENTRY
  Close crosses above EMA(20)
  AND EMA(20) is above EMA(50)
  AND RSI(14) > 55
  AND Volume > Average Volume(20) × 1.5

STOP
  Entry − ATR(14) × 1.5

TARGET
  Entry + (entry risk × 2)

EXIT
  Close crosses below EMA(20)
  OR stop OR target`}
        </pre>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          Plain language: enter when the stock closes above its 20-period EMA, the medium-term trend
          is positive, RSI shows momentum above 55, and volume is at least 50% higher than its
          20-period average. That sentence is a description of rules — not a recommendation to trade
          it.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-primary">Every student strategy must define</h2>
        <ul className="mt-2 grid gap-1 text-sm text-text-secondary sm:grid-cols-2">
          {REQUIRED.map((item) => (
            <li key={item} className="rounded-md border border-bg-border px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-text-primary">Warnings the builder will raise</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary">
          {WARNINGS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-text-tertiary">
        Unlocks with Level 7 after risk training. Until then, study{" "}
        <Link href="/lessons/position-sizing" className="text-accent">
          position sizing
        </Link>{" "}
        and{" "}
        <Link href="/classroom" className="text-accent">
          live charts
        </Link>
        .
      </p>
    </div>
  );
}

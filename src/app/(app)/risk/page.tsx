import Link from "next/link";
import { PositionSizeCalculator } from "@/components/learn/PositionSizeCalculator";

export default function RiskPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Risk calculator</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Maximum rupee risk = capital × risk percent. Position size = rupee risk ÷ (entry − stop).
          You must be able to do this before futures, options, or algo modules unlock.
        </p>
      </div>
      <div className="rounded-lg border border-bg-border bg-bg-raised p-5">
        <PositionSizeCalculator />
      </div>
      <p className="text-sm text-text-secondary">
        Worked example from the course: ₹1,00,000 capital, 1% risk, entry ₹500, stop ₹490 → 100
        shares. Read{" "}
        <Link href="/lessons/position-sizing" className="text-accent hover:underline">
          Position sizing
        </Link>{" "}
        and{" "}
        <Link href="/lessons/risk-of-ruin" className="text-accent hover:underline">
          Risk of ruin
        </Link>
        .
      </p>
    </div>
  );
}

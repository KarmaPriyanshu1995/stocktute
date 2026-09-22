import Link from "next/link";

export default function SimulatorPage() {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="font-display text-3xl text-text-primary">Paper-trading simulator</h1>
      <p className="text-sm text-text-secondary">
        Level 9. Virtual ₹5,00,000, costs, stops, journal tags, and risk-limit enforcement — before
        any live broker. Execution UI is next; the rules are already in the syllabus.
      </p>
      <p className="text-sm text-text-secondary">
        Until orders go live here, practise sizing on the{" "}
        <Link href="/risk" className="text-accent">
          risk calculator
        </Link>{" "}
        and read{" "}
        <Link href="/lessons/intraday-order" className="text-accent">
          order types
        </Link>
        .
      </p>
    </div>
  );
}

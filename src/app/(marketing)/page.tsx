import Link from "next/link";

/**
 * Placeholder landing page for Phase 1. The full editorial hero, 3D
 * candlestick R3F scene, and GSAP scroll animations land in Phase 8.
 */
export default function MarketingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-base px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        Educational simulation. Not investment advice.
      </p>
      <h1 className="max-w-3xl font-display text-5xl leading-tight tracking-tight text-text-primary md:text-6xl">
        Learn the market, <span className="italic">live</span>.
      </h1>
      <p className="max-w-xl text-balance text-text-secondary">
        A 12-level Indian-market course: foundations, candlesticks, risk, paper trading, then
        locked F&amp;O and algo — only after you can size a stop. No real money. No guaranteed tips.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-text-inverse transition-transform hover:scale-[1.02]"
        >
          Start learning
        </Link>
        <Link
          href="/classroom"
          className="rounded-md border border-bg-border-strong px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-surface"
        >
          See a live chart
        </Link>
      </div>
    </main>
  );
}

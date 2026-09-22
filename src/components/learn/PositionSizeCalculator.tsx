"use client";

import { useMemo, useState } from "react";

function money(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function PositionSizeCalculator() {
  const [capital, setCapital] = useState(100_000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(500);
  const [stop, setStop] = useState(490);

  const result = useMemo(() => {
    const rupeeRisk = capital * (riskPct / 100);
    const perShare = entry - stop;
    if (perShare <= 0) {
      return { error: "Stop must be below entry for a long example. For shorts, swap the labels and keep risk positive." };
    }
    const shares = Math.floor(rupeeRisk / perShare);
    const notional = shares * entry;
    const actualRisk = shares * perShare;
    return { rupeeRisk, perShare, shares, notional, actualRisk, error: null as string | null };
  }, [capital, riskPct, entry, stop]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
        <Field label="Account capital (₹)" value={capital} onChange={setCapital} />
        <Field label="Risk per trade (%)" value={riskPct} onChange={setRiskPct} step={0.25} />
        <Field label="Entry price (₹)" value={entry} onChange={setEntry} step={0.05} />
        <Field label="Stop-loss price (₹)" value={stop} onChange={setStop} step={0.05} />
      </form>
      <div className="rounded-lg border border-bg-border bg-bg-surface p-5 font-mono text-sm">
        <p className="font-sans text-xs uppercase tracking-wide text-text-tertiary">Formula</p>
        <p className="mt-2 text-text-secondary">Max ₹ risk = capital × risk%</p>
        <p className="text-text-secondary">Risk / share = entry − stop</p>
        <p className="text-text-secondary">Size = max ₹ risk ÷ risk / share</p>
        <hr className="my-4 border-bg-border" />
        {result.error ? (
          <p className="font-sans text-sm text-price-down">{result.error}</p>
        ) : (
          <dl className="grid grid-cols-2 gap-y-2 font-sans text-sm">
            <dt className="text-text-tertiary">Max rupee risk</dt>
            <dd className="text-right text-text-primary">₹{money(result.rupeeRisk)}</dd>
            <dt className="text-text-tertiary">Risk per share</dt>
            <dd className="text-right text-text-primary">₹{money(result.perShare)}</dd>
            <dt className="text-text-tertiary">Position size</dt>
            <dd className="text-right text-accent">{result.shares} shares</dd>
            <dt className="text-text-tertiary">Notional</dt>
            <dd className="text-right text-text-primary">₹{money(result.notional)}</dd>
            <dt className="text-text-tertiary">Actual risk if stopped</dt>
            <dd className="text-right text-text-primary">₹{money(result.actualRisk)}</dd>
          </dl>
        )}
        <p className="mt-4 font-sans text-xs text-text-tertiary">
          Gaps can skip your stop. This number is the planned loss, not the maximum possible loss.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-text-tertiary">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-bg-border bg-bg-surface px-3 py-2 font-mono text-text-primary outline-none focus:border-accent"
      />
    </label>
  );
}

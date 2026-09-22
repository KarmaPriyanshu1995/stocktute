"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminGenerate({ autoPublishDaily }: { autoPublishDaily: boolean }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [auto, setAuto] = useState(autoPublishDaily);

  async function generate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/chapters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date || undefined, force: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error ?? "Generate failed");
        return;
      }
      if (data?.skipped) {
        setMessage(`Skipped: ${data.reason}`);
      } else {
        setMessage(`Draft saved for ${data.chapter?.date ?? date}`);
        router.refresh();
      }
    } catch {
      setMessage("Generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAuto() {
    const next = !auto;
    setAuto(next);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoPublishDaily: next }),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-raised p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-text-tertiary">
          Session date (IST)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded-md border border-bg-border bg-bg-surface px-3 py-2 font-mono text-sm text-text-primary"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-inverse disabled:opacity-40"
        >
          {busy ? "Generating…" : "Generate draft"}
        </button>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={auto} onChange={() => void toggleAuto()} />
          Auto-publish future chapters if compliance is clean
        </label>
      </div>
      {message && <p className="text-sm text-text-secondary">{message}</p>}
    </div>
  );
}

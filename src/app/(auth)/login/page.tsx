"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setStatus("sent");
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } else {
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-base px-6">
      <div className="w-full max-w-sm rounded-lg border border-bg-border bg-bg-raised p-8">
        <h1 className="mb-1 font-display text-3xl text-text-primary">Sign in</h1>
        <p className="mb-6 text-sm text-text-secondary">Paper trading. Never real money.</p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mb-4 w-full rounded-md border border-bg-border-strong px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-surface-hover"
        >
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-text-tertiary">
          <div className="h-px flex-1 bg-bg-border" />
          or
          <div className="h-px flex-1 bg-bg-border" />
        </div>

        <form onSubmit={requestCode} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-bg-border bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-text-inverse disabled:opacity-60"
          >
            {status === "sending" ? "Sending code…" : "Email me a code"}
          </button>
          {status === "error" && (
            <p className="text-sm text-price-down">Couldn&apos;t send code. Try again.</p>
          )}
        </form>
      </div>
    </main>
  );
}

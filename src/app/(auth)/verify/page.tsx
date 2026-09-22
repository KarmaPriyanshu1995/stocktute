"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, type SignInResponse } from "next-auth/react";

function messageForSignInError(res: SignInResponse): string {
  if (res.code === "database_unavailable" || res.error === "CallbackRouteError") {
    return "Could not reach the database. Check that your IP is allowed in MongoDB Atlas, then try this same code again.";
  }
  if (res.code === "invalid_otp" || res.error === "CredentialsSignin") {
    return "Invalid or expired code. Request a new one if it has been more than 10 minutes.";
  }
  return "Sign-in failed. Try again.";
}

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setErrorMessage("");
    const res = await signIn("email-otp", { email, code: code.trim(), redirect: false });
    if (res?.error) {
      setErrorMessage(messageForSignInError(res));
      setStatus("error");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-base px-6">
      <div className="w-full max-w-sm rounded-lg border border-bg-border bg-bg-raised p-8">
        <h1 className="mb-1 font-display text-3xl text-text-primary">Enter your code</h1>
        <p className="mb-6 text-sm text-text-secondary">
          We sent a 6-digit code to <span className="text-text-primary">{email}</span>
        </p>

        <form onSubmit={verify} className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-md border border-bg-border bg-bg-surface px-3 py-2.5 text-center font-mono text-lg tracking-[0.5em] text-text-primary outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={status === "verifying"}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-text-inverse disabled:opacity-60"
          >
            {status === "verifying" ? "Verifying…" : "Verify"}
          </button>
          {status === "error" && (
            <p className="text-sm text-price-down">{errorMessage}</p>
          )}
        </form>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}

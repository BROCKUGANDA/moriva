"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MorivaLogo } from "@/components/moriva/brand";
import { InlineNotice } from "@/components/moriva/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_PASSWORD = "Moriva-Demo-2026!";
const DEMO_ACCOUNTS = [
  { hint: "INDIVIDUAL", label: "Individual", email: "demo.individual@moriva.demo" },
  { hint: "PROFESSIONAL", label: "Professional", email: "demo.clinician@moriva.demo" },
  { hint: "OPS", label: "Operations", email: "demo.ops@moriva.demo" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? "Sign in failed. Check your details and try again.");
        return;
      }
      const role = body?.user?.role;
      if (role === "OPS_ADMIN_SIMULATED") router.push("/ops/overview");
      else if (role !== "INDIVIDUAL") router.push("/professional/inbox");
      else router.push("/app");
      router.refresh();
    } catch {
      setError("We couldn't reach the service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(email: string) {
    setEmail(email);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <main id="main-content" className="moriva-gradient-soft flex min-h-screen flex-col">
      <div className="moriva-container flex w-full flex-1 flex-col items-center justify-center py-10">
        <Link href="/" aria-label="MORIVA home"><MorivaLogo withTagline /></Link>
        <div className="mt-8 w-full max-w-md rounded-2xl border border-moriva-line bg-white p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-moriva-ink">Sign in</h1>
          <p className="mt-1 text-sm text-moriva-slate">Private and voluntary. Your data stays yours.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>
            {error && <InlineNotice kind="critical" role="alert">{error}</InlineNotice>}
            <Button type="submit" disabled={busy} className="min-h-12 w-full bg-moriva-teal text-base font-bold hover:bg-moriva-teal-soft" data-testid="signin-submit">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-moriva-slate">
            New here? <Link href="/register" className="font-semibold text-moriva-teal underline-offset-4 hover:underline">Create an account</Link>
          </p>
        </div>

        {/* Demo identities — only meaningful because DEMO_MODE=true; production refuses demo credentials */}
        <div className="mt-6 w-full max-w-md rounded-2xl border border-dashed border-moriva-teal/50 bg-white/70 p-5" data-testid="demo-accounts">
          <p className="text-xs font-bold uppercase tracking-widest text-moriva-teal">Demo environment — synthetic accounts</p>
          <p className="mt-1 text-xs text-moriva-slate">
            Shared demo password: <code className="rounded bg-muted px-1.5 py-0.5">Moriva-Demo-2026!</code>
          </p>
          <div className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map(({ hint, label, email: demoEmail }) => (
              <button
                key={hint}
                type="button"
                onClick={() => fillDemo(demoEmail)}
                disabled={busy}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-moriva-line bg-white px-3 py-2.5 text-left transition-colors hover:border-moriva-teal hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
                data-testid={`demo-${hint.toLowerCase()}`}
              >
                <span className="text-sm font-semibold text-moriva-ink">{label}</span>
                <span className="min-w-0 truncate text-[11px] text-moriva-slate">{demoEmail}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-moriva-slate">
            Click an account to fill the form, then press Sign in. Demo mode is enabled; production refuses demo
            identities at startup — this is enforced in code.
          </p>
        </div>
      </div>
    </main>
  );
}

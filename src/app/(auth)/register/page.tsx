"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MorivaLogo } from "@/components/moriva/brand";
import { InlineNotice } from "@/components/moriva/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const OPTIONAL_PURPOSES = [
  { code: "JOURNAL_STORAGE", title: "Private journal", body: "Store private notes you write. Never analysed or shared automatically." },
  { code: "AI_PROCESSING", title: "AI reflection assistance", body: "Allow optional, redacted processing by an external AI model. This feature is disabled in this prototype; your choice is stored." },
  { code: "FOLLOWUP_NOTIFICATIONS", title: "Follow-up notifications", body: "Neutral reminders like “You have an update in MORIVA”. Never includes clinical details." },
  { code: "RESEARCH", title: "Research use", body: "De-identified research under a separate governance route." },
  { code: "MARKETING", title: "Marketing", body: "Product news. Never bundled with care workflows." },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // No pre-ticked checkboxes (FR-CN-002): optional consents default to false.
  const [optional, setOptional] = useState<Record<string, boolean>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? "Registration failed. Check the fields and try again.");
        return;
      }
      // grant only explicitly opted-in optional purposes + required account consent
      const csrf = document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "";
      const purposes = ["ACCOUNT_SECURITY", "ASSESSMENT_STORAGE", ...Object.entries(optional).filter(([, v]) => v).map(([k]) => k)];
      for (const purpose of purposes) {
        await fetch("/api/v1/me/consents", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `reg-consent-${purpose}` },
          body: JSON.stringify({ purpose }),
        });
      }
      router.push("/app/onboarding");
      router.refresh();
    } catch {
      setError("We couldn't reach the service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" className="moriva-gradient-soft flex min-h-screen flex-col">
      <div className="moriva-container flex w-full flex-1 flex-col items-center justify-center py-10">
        <Link href="/" aria-label="MORIVA home"><MorivaLogo withTagline /></Link>
        <div className="mt-8 w-full max-w-lg rounded-2xl border border-moriva-line bg-white p-8 shadow-card">
          <h1 className="font-display text-2xl font-bold text-moriva-ink">Create your account</h1>
          <p className="mt-1 text-sm text-moriva-slate">
            Adults 18+. Creating an account processes your email for sign-in and security (required). Everything else is
            separate and optional.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" required minLength={2} maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" placeholder="How should we greet you?" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Password (10+ characters)</Label>
              <Input id="password" type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
            </div>

            <fieldset className="rounded-xl border border-moriva-line bg-muted/40 p-4">
              <legend className="px-1 text-sm font-bold text-moriva-ink">Your choices, separately</legend>
              <p className="text-xs text-moriva-slate">
                Required to provide the service: account security; storing assessments so you can see history and resume.
                The following are optional — decline anything without losing unrelated features.
              </p>
              <div className="mt-3 space-y-3">
                {OPTIONAL_PURPOSES.map((p) => (
                  <div key={p.code} className="flex items-start gap-3">
                    <Checkbox
                      id={`consent-${p.code}`}
                      checked={Boolean(optional[p.code])}
                      onCheckedChange={(v) => setOptional((s) => ({ ...s, [p.code]: v === true }))}
                      className="mt-0.5"
                    />
                    <Label htmlFor={`consent-${p.code}`} className="block cursor-pointer text-sm font-medium leading-snug">
                      {p.title}
                      <span className="block text-xs font-normal text-moriva-slate">{p.body}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>

            {error && <InlineNotice kind="critical" role="alert">{error}</InlineNotice>}
            <Button type="submit" disabled={busy} className="min-h-12 w-full bg-moriva-teal text-base font-bold hover:bg-moriva-teal-soft" data-testid="register-submit">
              {busy ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-moriva-slate">
              Already have an account? <Link href="/login" className="font-semibold text-moriva-teal underline-offset-4 hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

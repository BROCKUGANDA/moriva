"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function IndividualOverviewActions() {
  const router = useRouter();
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  async function mood(v: 1 | 2 | 3 | 4) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `overview-${Date.now()}-${v}` },
        body: JSON.stringify({ mood: v }),
      });
      if (res.ok) {
        setCheckedIn(["", "Rough", "Low", "Okay", "Good"][v]);
        setTimeout(() => router.refresh(), 600);
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "Could not save your check-in. Please try again.");
      }
    } catch {
      setError("Could not save your check-in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="quick-checkin" className="rounded-2xl border border-moriva-line bg-white p-5">
      <h2 id="quick-checkin" className="font-display text-base font-bold text-moriva-ink">Quick check-in (optional)</h2>
      <p className="mt-1 text-sm text-moriva-slate">
        A simple tag for today — not a score, not saved as an assessment. <Link href="/app/check-in" className="text-moriva-teal underline-offset-2 hover:underline">About check-ins</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {([1, 2, 3, 4] as const).map((v) => (
          <Button key={v} variant="outline" disabled={busy} onClick={() => mood(v)} className="min-h-11">
            {["", "Rough", "Low", "Okay", "Good"][v]}
          </Button>
        ))}
        {checkedIn && <span role="status" className="self-center text-sm font-semibold text-state-success">Noted — thanks for checking in.</span>}
        {error && <span role="alert" className="self-center text-sm font-semibold text-state-critical">{error}</span>}
      </div>
    </section>
  );
}

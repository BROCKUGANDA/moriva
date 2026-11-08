"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function IndividualOverviewActions() {
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  async function mood(v: 1 | 2 | 3 | 4) {
    setBusy(true);
    try {
      // simple in-app note: a lightweight, non-validated mood tag stored as a notification-free check-in
      const res = await fetch("/api/v1/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ mood: v }),
      });
      if (res.ok) {
        setCheckedIn(["", "Rough", "Low", "Okay", "Good"][v]);
        setTimeout(() => window.location.reload(), 600);
      }
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
      </div>
    </section>
  );
}

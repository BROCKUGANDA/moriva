"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/moriva/locale-provider";

export function CheckInClient() {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  async function tag(v: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `checkin-${Date.now()}-${v}` },
        body: JSON.stringify({ mood: v }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => (window.location.href = "/app"), 800);
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

  const options = [
    { v: 1, label: "Rough", desc: "Today felt heavy" },
    { v: 2, label: "Low", desc: "Flat or drained" },
    { v: 3, label: "Okay", desc: "Manageable" },
    { v: 4, label: "Good", desc: "Steady or bright" },
  ];

  return (
    <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card" data-testid="checkin-grid">
      <h2 className="font-display text-lg font-bold text-moriva-ink">How is today going?</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((o) => (
          <button
            key={o.v}
            disabled={busy || done}
            onClick={() => tag(o.v)}
            className="min-h-24 rounded-xl border border-moriva-line bg-white px-3 py-4 text-center hover:border-moriva-teal hover:bg-secondary disabled:opacity-50"
          >
            <span className="block font-display text-base font-bold text-moriva-ink">{o.label}</span>
            <span className="mt-1 block text-xs text-moriva-slate">{o.desc}</span>
          </button>
        ))}
      </div>
      {done && <p role="status" className="mt-3 text-sm font-semibold text-state-success">Noted. Taking you back to your overview…</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-state-critical">{error}</p>}
    </div>
  );
}

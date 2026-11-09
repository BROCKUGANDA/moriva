"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/moriva/status";
import { GlyphConsentKey, GlyphSignal, GlyphPathway, GlyphHandoff, GlyphCareContext, GlyphFollowThrough } from "@/components/moriva/glyphs";

type ConsentRow = {
  id: string; purpose: string; purposeTitle: string; wordingVersion: number; required: boolean;
  recipientType: string; status: string; grantedAt: string; revokedAt: string | null; expiresAt: string | null;
  dataCategories: string[];
};

/** Onboarding: review consents; decline optional ones freely (AC-PR-02). */
export function OnboardingConsentReview() {
  const [rows, setRows] = useState<ConsentRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  const load = () =>
    fetch("/api/v1/me/consents")
      .then((r) => r.json())
      .then((b) => setRows(b.data ?? b.consents ?? []))
      .catch(() => setRows([]));

  useEffect(() => { load(); }, []);

  async function toggle(row: ConsentRow, grant: boolean) {
    setBusy(true);
    try {
      if (grant) {
        await fetch("/api/v1/me/consents", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `consent-${row.purpose}-${Date.now()}` }, body: JSON.stringify({ purpose: row.purpose }) });
      } else {
        await fetch("/api/v1/me/consents", { method: "DELETE", headers: { "Content-Type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ purpose: row.purpose }) });
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {rows === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
      ) : (
        rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card" data-testid={`consent-${row.purpose}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-moriva-ink">{row.purposeTitle}</h3>
                <p className="mt-0.5 text-xs text-moriva-slate">
                  Wording v{row.wordingVersion} · {row.recipientType === "PLATFORM" ? "MORIVA platform" : row.recipientType.toLowerCase()} · {row.dataCategories.join(", ") || "—"}
                </p>
              </div>
              <StatusPill status={row.status} required={row.required} />
            </div>
            <p className="mt-2 text-sm text-moriva-slate">
              {row.required ? "Required to provide the service." : "Optional — declining doesn't affect anything else."}
            </p>
            {!row.required && (
              <div className="mt-3">
                {row.status === "GRANTED" ? (
                  <Button variant="outline" onClick={() => toggle(row, false)} disabled={busy} className="min-h-11">
                    Withdraw
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => toggle(row, true)} disabled={busy} className="min-h-11">
                    Allow
                  </Button>
                )}
              </div>
            )}
          </article>
        ))
      )}

      <div className="grid gap-3 rounded-2xl border border-moriva-line bg-white p-5 shadow-card sm:grid-cols-3">
        {[
          { Icon: GlyphSignal, title: "Notice", body: "Private check-ins and assessments — voluntary, always." },
          { Icon: GlyphPathway, title: "Choose", body: "Options with reasons. A menu, not a mandate." },
          { Icon: GlyphHandoff, title: "Connect", body: "Share only what you approve, with who you pick." },
          { Icon: GlyphConsentKey, title: "Consent", body: "Separate purposes, withdraw any time." },
          { Icon: GlyphCareContext, title: "Context", body: "Health context stays under your control." },
          { Icon: GlyphFollowThrough, title: "Follow through", body: "See whether the handoff actually happened." },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-moriva-teal" aria-hidden />
            <div>
              <p className="text-sm font-bold text-moriva-ink">{title}</p>
              <p className="text-xs text-moriva-slate">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/app" className="inline-flex min-h-12 items-center rounded-xl bg-moriva-teal px-6 font-bold text-white hover:bg-moriva-teal-soft">
          Go to my overview
        </Link>
        <Link href="/app/assessments" className="inline-flex min-h-12 items-center rounded-xl border border-moriva-teal px-6 font-semibold text-moriva-teal hover:bg-secondary">
          Try a check-in
        </Link>
      </div>
    </div>
  );
}

function StatusPill({ status, required }: { status: string; required: boolean }) {
  const tone = status === "GRANTED" ? (required ? "bg-secondary text-moriva-teal" : "bg-[#E9F4EE] text-state-success") : "bg-muted text-moriva-slate";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{status === "GRANTED" ? "Allowed" : "Withdrawn"}</span>;
}

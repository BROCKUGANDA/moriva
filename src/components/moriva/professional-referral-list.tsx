"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, EmptyState } from "@/components/moriva/status";

type Row = {
  referralId: string; state: string; patientAlias: string; serviceName: string; providerName: string;
  simulated: boolean; sharedFields: string[]; createdAt: string;
  lastEvent: { toState: string | null; occurredAt: string } | null;
};

/** Inbox with tabs (PRD §7.8): New / Acknowledged / Needs information / Closed. */
export function ProfessionalReferralList({ tabs }: { tabs: Array<{ key: string; label: string; rows: Row[] }> }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "new");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div>
      <div role="tablist" aria-label="Inbox tabs" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold ${active === t.key ? "bg-moriva-teal text-white" : "border border-moriva-line bg-white text-moriva-slate hover:bg-muted"}`}
          >
            {t.label} ({t.rows.length})
          </button>
        ))}
      </div>
      <div className="mt-4">
        {current.rows.length === 0 ? (
          <EmptyState title={`Nothing in ${current.label.toLowerCase()}`} />
        ) : (
          <ul className="space-y-3" data-testid="professional-inbox-list">
            {current.rows.map((r) => (
              <li key={r.referralId} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-moriva-ink">
                      <Link href={`/professional/referrals/${r.referralId}`} className="hover:text-moriva-teal">{r.patientAlias} — {r.serviceName}</Link>
                    </h3>
                    <p className="text-sm text-moriva-slate">{r.providerName} · created {new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <p className="mt-1 text-xs text-moriva-slate">Sharing scope: {r.sharedFields.map((f) => f.toLowerCase().replace(/_/g, " ")).join(", ") || "none recorded"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge tone={r.state === "PENDING_PROVIDER_ACKNOWLEDGEMENT" ? "warning" : "teal"}>{r.state.replace(/_/g, " ").toLowerCase()}</StatusBadge>
                    {r.simulated && <StatusBadge tone="coral">SIMULATED</StatusBadge>}
                  </div>
                </div>
                <Link href={`/professional/referrals/${r.referralId}`} className="mt-3 inline-block min-h-11 rounded-lg bg-moriva-teal px-4 py-2 text-sm font-semibold leading-6 text-white hover:bg-moriva-teal-soft">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

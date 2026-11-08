"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { VerificationBadge, StatusBadge, EmptyState } from "@/components/moriva/status";

type ProviderRow = {
  id: string; displayName: string; legalName: string; jurisdiction: string;
  verificationStatus: string; demoData: boolean; verifiedAt: string | null; recheckDueAt: string | null;
  services: Array<{
    id: string; serviceName: string; careLevel: string; languages: string[]; eligibility: string;
    location: string; accessibility: string; status: string; referrable: boolean; lastVerifiedAt: string | null;
  }>;
};

const CARE_LEVELS = [
  { value: "", label: "All support types" },
  { value: "SELF_GUIDED", label: "Self-guided" },
  { value: "COMMUNITY", label: "Community" },
  { value: "PRIMARY_CARE", label: "Primary care" },
  { value: "TELEMH", label: "Tele-mental health" },
  { value: "SPECIALIST", label: "Specialist" },
];

export function ProviderSearch() {
  const [providers, setProviders] = useState<ProviderRow[] | null>(null);
  const [q, setQ] = useState("");
  const [careLevel, setCareLevel] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (q) qs.set("q", q);
      if (careLevel) qs.set("careLevel", careLevel);
      if (language) qs.set("language", language);
      fetch(`/api/v1/providers?${qs}`)
        .then((r) => r.json())
        .then((b) => setProviders(b.providers ?? []))
        .catch(() => setProviders([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, careLevel, language]);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="search">
        <Input
          type="search"
          placeholder="Search services…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-h-11 max-w-xs"
          aria-label="Search services"
        />
        <select value={careLevel} onChange={(e) => setCareLevel(e.target.value)} aria-label="Support type" className="min-h-11 rounded-lg border border-moriva-line bg-white px-3 text-sm">
          {CARE_LEVELS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language" className="min-h-11 rounded-lg border border-moriva-line bg-white px-3 text-sm">
          <option value="">Any language</option>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </div>

      {providers === null ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No matching services">
            Try adjusting the filters — or view general support options. We never show unverified or expired listings.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2" data-testid="provider-grid">
          {providers.map((p) => (
            <article key={p.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-moriva-ink">{p.displayName}</h3>
                  <p className="text-xs text-moriva-slate">{p.jurisdiction}</p>
                </div>
                <VerificationBadge
                  status={p.verificationStatus}
                  demoData={p.demoData}
                  lastVerifiedLabel={p.verifiedAt ? `checked ${p.verifiedAt.slice(0, 10)}` : undefined}
                />
              </div>
              <ul className="mt-3 space-y-2">
                {p.services.map((s) => (
                  <li key={s.id} className="rounded-lg border border-moriva-line px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-moriva-ink">{s.serviceName}</p>
                        <p className="text-xs text-moriva-slate">
                          {s.careLevel.replace("_", "-").toLowerCase()} · {s.languages.join(", ")} · {s.location}
                          {s.accessibility ? ` · ${s.accessibility}` : ""}
                        </p>
                        <p className="text-xs text-moriva-slate">Eligibility: {s.eligibility}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {s.referrable ? (
                          <Link href={`/app/providers/${s.id}`} className="min-h-11 rounded-lg bg-moriva-teal px-3 py-2 text-xs font-semibold text-white hover:bg-moriva-teal-soft">
                            View & refer
                          </Link>
                        ) : (
                          <StatusBadge tone="warning">Re-verification in progress</StatusBadge>
                        )}
                        {s.lastVerifiedAt && <span className="text-[11px] text-moriva-slate">checked {s.lastVerifiedAt.slice(0, 10)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

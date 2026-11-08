"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { InlineNotice, StatusBadge, EmptyState } from "@/components/moriva/status";
import { GlyphPathway, GlyphHandoff } from "@/components/moriva/glyphs";

type NavResult = {
  ruleVersion: string;
  rulesStatus: string;
  options: Array<{
    optionId: string;
    serviceCategory: string;
    rationaleCode: string;
    rationaleText: string;
    urgencyLabel: string;
    providerServiceIds: string[];
  }>;
  requiresHumanReview: boolean;
  safetyOverride: boolean;
  note: string;
};

const CATEGORY_COPY: Record<string, { title: string; blurb: string }> = {
  SELF_GUIDED: { title: "Self-guided resources", blurb: "Information and exercises you can explore on your own, at your own pace." },
  COMMUNITY: { title: "Community support", blurb: "Non-clinical programmes and groups run by community organisations." },
  PRIMARY_CARE: { title: "Primary healthcare", blurb: "Start with a family doctor or GP, who can assess and refer onward." },
  TELEMH: { title: "Tele-mental health", blurb: "Qualified mental-health care by video or phone." },
  SPECIALIST: { title: "Specialist mental-health services", blurb: "Specialist assessment and care for mental health." },
  EMERGENCY: { title: "Emergency services", blurb: "For immediate danger — call 999 or go to the nearest emergency department." },
};

/**
 * Stepped support options from the deterministic navigator.
 * Shows why each option appears + rule version (AC-PR-06); user can pick any option
 * or none. Also lists demo providers per category.
 */
export function SupportOptionsAfterResult({ resultId }: { resultId?: string }) {
  const [nav, setNav] = useState<NavResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<Array<{ id: string; titleEn: string; resourceType: string; sourceOrg: string; eligibility: string }>>([]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (resultId) qs.set("resultId", resultId);
    fetch(`/api/v1/support-options?${qs}`)
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.message ?? "Options unavailable");
        return body as NavResult;
      })
      .then(setNav)
      .catch((e) => setError(e.message));
    fetch("/api/v1/support-options")
      .then(() => {})
      .catch(() => {});
    // community/self-guided resources come from the directory search (public support resources)
    fetch("/api/v1/providers")
      .then((r) => r.json())
      .catch(() => null);
  }, [resultId]);

  // fetch support resources via a light endpoint (reuse providers list w/ resources is separate — use the public payload)
  useEffect(() => {
    fetch("/api/v1/support-resources")
      .then((r) => (r.ok ? r.json() : { resources: [] }))
      .then((b) => setResources(b.resources ?? []))
      .catch(() => {});
  }, []);

  if (error) {
    return (
      <InlineNotice kind="warning" title="Personalised options are temporarily unavailable.">
        {error} You can view general support options below or open{" "}
        <Link href="/help-now" className="font-bold text-state-critical underline">Help Now</Link>.
      </InlineNotice>
    );
  }
  if (!nav) {
    return <div className="mt-3 h-40 animate-pulse rounded-2xl bg-muted" aria-busy="true" />;
  }

  return (
    <div className="mt-3" data-testid="support-options">
      <div className="flex flex-wrap items-center gap-2 text-xs text-moriva-slate">
        <StatusBadge tone="teal">Rule set v{nav.ruleVersion}</StatusBadge>
        <span>Why these options? A fixed, versioned rule set chooses them the same way every time — no AI involved.</span>
      </div>
      {nav.note && <p className="mt-1 text-xs text-state-warning">{nav.note}</p>}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {nav.options.map((opt) => {
          const copy = CATEGORY_COPY[opt.serviceCategory] ?? { title: opt.serviceCategory, blurb: "" };
          return (
            <article key={opt.optionId} className="flex flex-col rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-bold text-moriva-ink">{copy.title}</h3>
                {opt.serviceCategory === "TELEMH" ? (
                  <GlyphHandoff className="h-5 w-5 shrink-0 text-moriva-teal" />
                ) : (
                  <GlyphPathway className="h-5 w-5 shrink-0 text-moriva-teal" />
                )}
              </div>
              <p className="mt-1 text-sm text-moriva-slate">{copy.blurb}</p>
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-moriva-ink/80" title={`Rule reference: ${opt.rationaleCode}`}>
                <strong>Why this appears:</strong> {opt.rationaleText}
              </p>
              <div className="mt-3">
                <ProvidersForOption ids={opt.providerServiceIds} />
              </div>
            </article>
          );
        })}
      </div>

      {resources.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display text-base font-bold text-moriva-ink">Information & community resources</h3>
          <ul className="mt-2 grid gap-2 md:grid-cols-3">
            {resources.map((r) => (
              <li key={r.id} className="rounded-xl border border-moriva-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-moriva-teal">{r.resourceType.replace("_", " ")}</p>
                <p className="mt-1 text-sm font-semibold text-moriva-ink">{r.titleEn}</p>
                <p className="mt-1 text-xs text-moriva-slate">{r.sourceOrg} · {r.eligibility}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-moriva-slate">Opening a resource does not share your identity or assessment data.</p>
        </div>
      )}
    </div>
  );
}

function ProvidersForOption({ ids }: { ids: string[] }) {
  const [providers, setProviders] = useState<Array<{ id: string; serviceName: string; providerDisplayName: string; location: string; simulated: boolean }>>([]);
  useEffect(() => {
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => fetch(`/api/v1/provider-services/${id}`).then((r) => (r.ok ? r.json() : null))))
      .then((rows) => setProviders(rows.filter(Boolean).map((r: { service: { id: string; serviceName: string; providerDisplayName: string; location: string; simulated: boolean } }) => r.service)))
      .catch(() => {});
  }, [ids.join(",")]);
  if (ids.length === 0) return <p className="text-xs text-moriva-slate">No matching verified services to list right now.</p>;
  if (providers.length === 0) return <div className="h-10 w-full animate-pulse rounded bg-muted" aria-busy="true" />;
  return (
    <ul className="space-y-2">
      {providers.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-moriva-line px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-moriva-ink">{p.serviceName}</p>
            <p className="text-xs text-moriva-slate">{p.providerDisplayName} · {p.location}</p>
          </div>
          {p.simulated && <StatusBadge tone="coral">SIMULATED</StatusBadge>}
          <Link href={`/app/providers/${p.id.replace("svc:", "")}`} className="min-h-11 rounded-lg border border-moriva-teal px-3 py-2 text-xs font-semibold text-moriva-teal hover:bg-secondary">
            View
          </Link>
        </li>
      ))}
    </ul>
  );
}

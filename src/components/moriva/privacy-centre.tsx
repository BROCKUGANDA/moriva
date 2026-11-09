"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge, InlineNotice, EmptyState } from "@/components/moriva/status";

type ConsentRow = {
  id: string; purpose: string; purposeTitle: string; wordingVersion: number; required: boolean;
  recipientType: string; recipientId: string | null; status: string; grantedAt: string; revokedAt: string | null;
  expiresAt: string | null; dataCategories: string[];
};
type RequestRow = { id: string; requestType: string; status: string; createdAt: string; note: string };
type AccessRow = { id: string; action: string; resourceType: string; outcome: string; occurredAt: string; actorRole: string | null };

/**
 * Privacy centre (PRD §7.9): consent ledger with "who can see this", revoke,
 * export/deletion requests, access history.
 */
export function PrivacyCentre() {
  const [tab, setTab] = useState<"consents" | "requests" | "access">("consents");
  const [consents, setConsents] = useState<ConsentRow[] | null>(null);
  const [requests, setRequests] = useState<RequestRow[] | null>(null);
  const [access, setAccess] = useState<AccessRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  function load() {
    fetch("/api/v1/me/consents").then((r) => r.json()).then((b) => setConsents(b.data ?? b.consents ?? [])).catch(() => setConsents([]));
    fetch("/api/v1/me/data-requests").then((r) => r.json()).then((b) => setRequests(b.data ?? b.requests ?? [])).catch(() => setRequests([]));
    fetch("/api/v1/me/access-history").then((r) => r.json()).then((b) => setAccess(b.data ?? b.events ?? [])).catch(() => setAccess([]));
  }
  useEffect(load, []);

  async function toggle(row: ConsentRow, grant: boolean) {
    setBusy(true);
    try {
      const res = grant
        ? await fetch("/api/v1/me/consents", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `consent-${row.purpose}-${Date.now()}` }, body: JSON.stringify({ purpose: row.purpose }) })
        : await fetch("/api/v1/me/consents", { method: "DELETE", headers: { "Content-Type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ purpose: row.purpose, recipientId: row.recipientId }) });
      if (res.ok) setNotice(grant ? "Permission recorded." : "Withdrawn — future sharing under this permission is blocked.");
      else {
        const body = await res.json().catch(() => null);
        setNotice(body?.message ?? "Could not update the permission. Please try again.");
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  const [download, setDownload] = useState<{ filename: string; href: string } | null>(null);

  async function request(type: "EXPORT" | "DELETION") {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/me/data-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": `datareq-${type}-${Date.now()}` },
        body: JSON.stringify({ requestType: type }),
      });
      const b = await res.json().catch(() => null);
      if (res.ok) {
        if (type === "EXPORT" && b?.download) {
          const blob = new Blob([JSON.stringify(b.download.payload, null, 2)], { type: "application/json" });
          const href = URL.createObjectURL(blob);
          setDownload({ filename: b.download.filename, href });
          setNotice("Export ready — download it below. A copy of this request is also in your history.");
        } else {
          setNotice(type === "EXPORT" ? "Export request received — you'll find the file in your notifications when it's ready." : "Deletion request received. Records kept for legal/security reasons are explained in the request status.");
        }
      }
      else setNotice(b?.message ?? "Could not submit the request.");
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Privacy centre sections" className="flex flex-wrap gap-2">
        {([["consents", "Consents"], ["requests", "Export & deletion"], ["access", "Access history"]] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold ${tab === key ? "bg-moriva-teal text-white" : "border border-moriva-line bg-white text-moriva-slate hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && <InlineNotice kind="success" className="mt-3">{notice}</InlineNotice>}

      {tab === "consents" && (
        <div className="mt-4 space-y-3" data-testid="consent-ledger">
          {consents === null ? (
            <div className="h-32 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
          ) : consents.length === 0 ? (
            <EmptyState title="No permissions recorded yet" />
          ) : (
            consents.map((row) => (
              <article key={row.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-moriva-ink">{row.purposeTitle}</h3>
                    <p className="mt-0.5 text-xs text-moriva-slate">
                      Wording v{row.wordingVersion} · {row.recipientType === "PLATFORM" ? "MORIVA platform" : row.recipientType === "PROVIDER" ? "the named provider on the referral" : row.recipientType.toLowerCase()} · data: {row.dataCategories.join(", ") || "—"}
                    </p>
                    <p className="mt-1 text-xs text-moriva-slate">
                      Granted {new Date(row.grantedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      {row.expiresAt ? ` · expires ${row.expiresAt.slice(0, 10)}` : ""}
                      {row.status === "REVOKED" && row.revokedAt ? ` · withdrawn ${new Date(row.revokedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                    </p>
                  </div>
                  <StatusBadge tone={row.status === "GRANTED" ? (row.required ? "teal" : "success") : "neutral"}>{row.status.toLowerCase()}</StatusBadge>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-moriva-teal">Who can see this?</summary>
                  <p className="mt-1 text-xs text-moriva-slate">
                    {row.purpose === "JOURNAL_STORAGE" && "Only you. No one else can read journal entries — not staff, not providers."}
                    {row.purpose === "ASSESSMENT_STORAGE" && "Only you. Results are shared only if you attach one to a referral."}
                    {row.purpose === "REFERRAL" && `The provider named on the referral sees only the fields shown in the share preview.${row.recipientId ? " This permission covers one referral to one provider." : ""}`}
                    {row.purpose === "HEALTH_CONTEXT_SHARE" && "The provider you named, for the fields and time window you chose."}
                    {row.purpose === "AI_PROCESSING" && "If this feature is ever enabled: a redacted subset processed by the model provider under contract. Disabled in this prototype."}
                    {row.purpose === "ACCOUNT_SECURITY" && "The platform's security systems. Auditable, never used for profiling."}
                    {row.purpose === "FOLLOWUP_NOTIFICATIONS" && "Notification delivery systems. Message content is neutral."}
                    {row.purpose === "RESEARCH" && "De-identified data under a separate governance route."}
                    {row.purpose === "MARKETING" && "The email system, for product news only."}
                  </p>
                </details>
                {!row.required && (
                  <div className="mt-3">
                    {row.status === "GRANTED" ? (
                      <Button variant="outline" onClick={() => toggle(row, false)} disabled={busy} className="min-h-11">Withdraw</Button>
                    ) : (
                      <Button variant="outline" onClick={() => toggle(row, true)} disabled={busy} className="min-h-11">Allow again</Button>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {tab === "requests" && (
        <div className="mt-4 space-y-4" data-testid="data-requests">
          <div className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
            <h3 className="font-display text-base font-bold text-moriva-ink">Export your data</h3>
            <p className="mt-1 text-sm text-moriva-slate">Receive a copy of your account, assessments, journal, referrals and consent records.</p>
            <Button onClick={() => request("EXPORT")} disabled={busy} className="mt-3 min-h-11 bg-moriva-teal font-semibold hover:bg-moriva-teal-soft">Request export</Button>
            {download && (
              <a href={download.href} download={download.filename} className="ml-2 inline-block min-h-11 rounded-lg border border-moriva-teal px-4 py-2 text-sm font-semibold text-moriva-teal hover:bg-secondary">
                Download {download.filename}
              </a>
            )}
          </div>
          <div className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
            <h3 className="font-display text-base font-bold text-moriva-ink">Request deletion</h3>
            <p className="mt-1 text-sm text-moriva-slate">
              We delete what we can immediately. Records kept for legal or security reasons (audit events, consent proofs)
              are retained and anonymised where law allows — the request status explains exactly what applies.
            </p>
            <Button onClick={() => request("DELETION")} disabled={busy} variant="outline" className="mt-3 min-h-11">Request deletion</Button>
          </div>
          {requests && requests.length > 0 && (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-moriva-line bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-moriva-ink">{r.requestType.toLowerCase()} request</p>
                    <p className="text-xs text-moriva-slate">{new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {r.note}</p>
                  </div>
                  <StatusBadge tone={r.status === "COMPLETED" ? "success" : "teal"}>{r.status.toLowerCase().replace(/_/g, " ")}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "access" && (
        <div className="mt-4" data-testid="access-history">
          {access === null ? (
            <div className="h-32 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
          ) : access.length === 0 ? (
            <EmptyState title="No access events yet" />
          ) : (
            <ul className="space-y-2">
              {access.slice(0, 30).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-moriva-line bg-white px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-moriva-ink">{a.action.toLowerCase().replace(/_/g, " ")} · {a.resourceType.toLowerCase()}</p>
                    <p className="text-xs text-moriva-slate">{new Date(a.occurredAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{a.actorRole ? ` · by ${a.actorRole.toLowerCase().replace(/_/g, " ")}` : ""}</p>
                  </div>
                  <StatusBadge tone={a.outcome === "ALLOW" ? "success" : a.outcome === "DENY" ? "warning" : "critical"}>{a.outcome.toLowerCase()}</StatusBadge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-moriva-slate">Sensitive reads, consent changes, exports, and referral actions are all recorded here. This log cannot be edited from the app.</p>
        </div>
      )}
    </div>
  );
}

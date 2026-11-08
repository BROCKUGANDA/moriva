"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InlineNotice, StatusBadge, SimulationBanner } from "@/components/moriva/status";
import { GlyphConsentKey } from "@/components/moriva/glyphs";

type Preview = {
  recipient: { providerDisplayName: string; legalName: string; verificationStatus: string; demoData: boolean; serviceName: string; serviceLocation: string };
  fields: Array<{ code: string; description: string; value: string | null }>;
  purpose: string;
  dataCategories: string[];
  retentionNote: string;
  consentExpiryNote: string;
  simulated: boolean;
};

/**
 * Consent preview + referral creation (Journey A.10-12, PRD §7.6).
 * Flow: choose fields → exact preview → explicit consent capture → create with
 * idempotency key → honest status (timeout copy on network failure, never optimistic success).
 */
export function ReferralFlow({
  providerServiceId,
  assessmentResultId,
  defaultReason,
}: {
  providerServiceId: string;
  assessmentResultId?: string | null;
  defaultReason?: string;
}) {
  const [step, setStep] = useState<"fields" | "preview" | "done">("fields");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [sharedFields, setSharedFields] = useState<string[]>(["FIRST_NAME", "CONTACT_DETAILS", "REFERRAL_REASON"]);
  const [purpose, setPurpose] = useState(defaultReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string; state: string; duplicate: boolean } | null>(null);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  const idempotencyKey = useMemo(() => {
    // generated once per flow instance (component mount) — retries reuse it
    return `ref-${providerServiceId}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }, [providerServiceId]);

  function toggleField(code: string, checked: boolean) {
    setSharedFields((s) => (checked ? Array.from(new Set([...s, code])) : s.filter((f) => f !== code)));
  }

  async function loadPreview() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/v1/referrals/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ providerServiceId, assessmentResultId: assessmentResultId ?? null, sharedFields, purposeSummary: purpose || "Support requested via MORIVA" }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? "Could not build the share preview.");
        return;
      }
      setPreview(body.preview);
      setStep("preview");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAndSend() {
    if (!preview) return;
    setError(null);
    setBusy(true);
    try {
      // 1. capture consent for this named recipient (PRD §11.2 — recipient-specific consent)
      const consentRes = await fetch("/api/v1/me/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ purpose: "REFERRAL", dataCategories: preview.dataCategories, recipientType: "PROVIDER", recipientId: preview.recipient.providerId }),
      });
      const consentBody = await consentRes.json().catch(() => null);
      if (!consentRes.ok) {
        setError(consentBody?.message ?? "We couldn't record your consent. Nothing was shared.");
        return;
      }
      // 2. create the referral with the idempotency key bound to consent
      const res = await fetch("/api/v1/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf, "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          providerServiceId,
          assessmentResultId: assessmentResultId ?? null,
          consentEventId: consentBody.consent.id,
          sharedFields,
          purposeSummary: preview.purpose,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 202) {
        // delivery unknown — exact PRD copy, no retry loop
        setError("We can't confirm that the referral was sent yet. We're checking its status. Please don't submit it again.");
        return;
      }
      if (!res.ok) {
        setError(body?.message ?? "The referral could not be created. Nothing was shared.");
        return;
      }
      setResult(body.referral);
      setStep("done");
    } catch {
      setError("We can't confirm that the referral was sent yet. We're checking its status. Please don't submit it again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card" data-testid="referral-created">
        <h3 className="font-display text-lg font-bold text-state-success">Referral created</h3>
        <p className="mt-1 text-sm text-moriva-slate">
          Status: <strong>{result.state.replace(/_/g, " ").toLowerCase()}</strong>. The provider hasn't confirmed anything
          yet — creation is not the same as an appointment.
          {preview?.simulated && " This provider is a simulated demo listing; its response is generated for demonstration and marked as simulated."}
        </p>
        <div className="mt-4 flex gap-2">
          <Link href={`/app/referrals/${result.id}`} className="min-h-11 rounded-lg bg-moriva-teal px-4 py-2 text-sm font-semibold text-white hover:bg-moriva-teal-soft">
            Track this referral
          </Link>
          <Link href="/app/referrals" className="min-h-11 rounded-lg border border-moriva-teal px-4 py-2 text-sm font-semibold text-moriva-teal hover:bg-secondary">
            All referrals
          </Link>
        </div>
      </div>
    );
  }

  if (step === "preview" && preview) {
    return (
      <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card" data-testid="share-preview">
        <div className="flex items-center gap-2">
          <GlyphConsentKey className="h-5 w-5 text-moriva-teal" aria-hidden />
          <h3 className="font-display text-lg font-bold text-moriva-ink">Exactly what will be shared</h3>
        </div>
        {preview.simulated && <SimulationBanner className="mt-3" />}
        <div className="mt-4 rounded-xl bg-muted p-4">
          <p className="text-sm"><strong>To:</strong> {preview.recipient.providerDisplayName} — {preview.recipient.serviceName}</p>
          <p className="text-xs text-moriva-slate">{preview.recipient.legalName} · {preview.recipient.serviceLocation} · {preview.recipient.verificationStatus}</p>
          <ul className="mt-3 space-y-2">
            {preview.fields.map((f) => (
              <li key={f.code} className="rounded-lg border border-moriva-line bg-white px-3 py-2 text-sm">
                <span className="font-semibold text-moriva-ink">{f.description}:</span>{" "}
                <span className="text-moriva-slate">{f.value ?? "—"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-moriva-slate"><strong>Purpose:</strong> {preview.purpose}</p>
          <p className="mt-1 text-xs text-moriva-slate">{preview.retentionNote}</p>
          <p className="mt-1 text-xs text-moriva-slate">{preview.consentExpiryNote}</p>
        </div>
        {error && <InlineNotice kind="critical" className="mt-3">{error}</InlineNotice>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={confirmAndSend} disabled={busy} className="min-h-12 bg-moriva-teal px-6 font-bold hover:bg-moriva-teal-soft" data-testid="confirm-share">
            {busy ? "Sending…" : "I understand — share this and send the referral"}
          </Button>
          <Button variant="ghost" onClick={() => setStep("fields")} disabled={busy} className="min-h-12">
            Change fields
          </Button>
        </div>
        <p className="mt-2 text-xs text-moriva-slate">Nothing has been shared yet. Sharing happens only after you confirm.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
      <h3 className="font-display text-lg font-bold text-moriva-ink">Choose what to share</h3>
      <p className="mt-1 text-sm text-moriva-slate">Only the minimum needed. You'll see the exact preview before anything is sent.</p>
      <div className="mt-4 space-y-3">
        {[
          { code: "FIRST_NAME", label: "Your first name", desc: "So the provider knows who to expect." },
          { code: "CONTACT_DETAILS", label: "Your contact email", desc: "So the provider can reach you." },
          { code: "REFERRAL_REASON", label: "Your reason for the referral", desc: "Written by you below." },
          { code: "ASSESSMENT_SUMMARY", label: "Assessment summary", desc: "The result title and questionnaire version — never your individual answers." },
        ].map((f) => (
          <div key={f.code} className="flex items-start gap-3">
            <Checkbox
              id={`field-${f.code}`}
              checked={sharedFields.includes(f.code)}
              onCheckedChange={(v) => toggleField(f.code, v === true)}
              className="mt-0.5"
              disabled={f.code === "REFERRAL_REASON"}
            />
            <Label htmlFor={`field-${f.code}`} className="cursor-pointer text-sm font-medium leading-snug">
              {f.label}
              <span className="block text-xs font-normal text-moriva-slate">{f.desc}</span>
            </Label>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Label htmlFor="referral-reason">Your reason (shown to the provider)</Label>
        <Input
          id="referral-reason"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          maxLength={300}
          placeholder="In your own words — what kind of support are you looking for?"
          className="mt-1"
        />
      </div>
      {error && <InlineNotice kind="critical" className="mt-3">{error}</InlineNotice>}
      <Button onClick={loadPreview} disabled={busy} className="mt-4 min-h-12 bg-moriva-teal px-6 font-bold hover:bg-moriva-teal-soft" data-testid="build-preview">
        {busy ? "Preparing…" : "Preview what will be shared"}
      </Button>
    </div>
  );
}

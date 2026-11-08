"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InlineNotice } from "@/components/moriva/status";

const DECLINE_REASONS = [
  { value: "SERVICE_NOT_SUITABLE", label: "Service not suitable for this request" },
  { value: "NO_CAPACITY", label: "No capacity at the moment" },
  { value: "OUTSIDE_SCOPE", label: "Outside this service's scope" },
  { value: "OTHER", label: "Other (recorded as a neutral category)" },
];

/** Simulated professional actions — every action is forced to SIMULATED evidence server-side. */
export function ProfessionalReferralActions({ referralId, state, version }: { referralId: string; state: string; version: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState(DECLINE_REASONS[0].value);
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  async function act(action: string) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/v1/professional/referrals/${referralId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ note: note || undefined, safeReasonCode: action === "decline" ? reason : undefined }),
      });
      const b = await res.json().catch(() => null);
      if (!res.ok) {
        setError(b?.message ?? "Action failed — refresh to see the current state.");
        return;
      }
      setNote("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const can = {
    acknowledge: state === "PENDING_PROVIDER_ACKNOWLEDGEMENT" || state === "NEEDS_INFORMATION",
    needsInfo: ["PENDING_PROVIDER_ACKNOWLEDGEMENT", "ACKNOWLEDGED"].includes(state),
    offer: state === "ACKNOWLEDGED",
    schedule: ["ACKNOWLEDGED", "APPOINTMENT_OFFERED"].includes(state),
    decline: ["PENDING_PROVIDER_ACKNOWLEDGEMENT", "NEEDS_INFORMATION", "ACKNOWLEDGED"].includes(state),
    close: !["CLOSED", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT"].includes(state),
  };

  return (
    <section className="mt-4 rounded-2xl border border-moriva-line bg-white p-6 shadow-card" data-testid="professional-actions">
      <h2 className="font-display text-lg font-bold text-moriva-ink">Actions (simulated)</h2>
      <p className="mt-1 text-xs text-moriva-slate">All actions here are recorded with SIMULATED evidence. Nothing reaches a real provider or person.</p>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Optional note — clinical notes are stored separately from operations notes" className="mt-3" />
      {state === "PENDING_PROVIDER_ACKNOWLEDGEMENT" && (
        <p className="mt-2 text-xs text-moriva-slate">
          Acknowledge first — acknowledgement means the simulated service has seen the referral, not that care started.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {can.acknowledge && (
          <Button onClick={() => act("acknowledge")} disabled={busy !== null} className="min-h-11 bg-moriva-teal font-semibold hover:bg-moriva-teal-soft" data-testid="ack-referral">
            {busy === "acknowledge" ? "Saving…" : "Acknowledge"}
          </Button>
        )}
        {can.needsInfo && (
          <Button variant="outline" onClick={() => act("needs-information")} disabled={busy !== null} className="min-h-11">
            Request more information
          </Button>
        )}
        {can.offer && (
          <Button variant="outline" onClick={() => act("offer")} disabled={busy !== null} className="min-h-11">
            Offer appointment
          </Button>
        )}
        {can.schedule && (
          <Button onClick={() => act("schedule")} disabled={busy !== null} className="min-h-11 bg-moriva-teal font-semibold hover:bg-moriva-teal-soft" data-testid="schedule-referral">
            Mark appointment scheduled
          </Button>
        )}
        {can.decline && (
          <div className="flex flex-wrap items-center gap-2">
            <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Decline reason" className="min-h-11 rounded-lg border border-moriva-line bg-white px-3 text-sm">
              {DECLINE_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <Button variant="outline" onClick={() => act("decline")} disabled={busy !== null} className="min-h-11">
              Decline
            </Button>
          </div>
        )}
        {can.close && (
          <Button variant="ghost" onClick={() => act("close")} disabled={busy !== null} className="min-h-11">
            Close referral
          </Button>
        )}
      </div>
      {error && <InlineNotice kind="critical" className="mt-3">{error}</InlineNotice>}
    </section>
  );
}

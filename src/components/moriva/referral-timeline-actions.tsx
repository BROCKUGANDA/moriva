"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InlineNotice } from "@/components/moriva/status";

/** User actions on own referral: report contact, confirm follow-up, cancel, withdraw consent. */
export function ReferralTimelineActions({ referralId, state, version }: { referralId: string; state: string; version: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const csrf = typeof document !== "undefined" ? document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "" : "";

  async function act(kind: "contact" | "followup" | "cancel" | "withdraw") {
    setBusy(true);
    setError(null);
    try {
      if (kind === "withdraw") {
        const res = await fetch("/api/v1/me/consents", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
          body: JSON.stringify({ purpose: "REFERRAL" }),
        });
        if (!res.ok) {
          const b = await res.json().catch(() => null);
          setError(b?.message ?? "Could not withdraw consent.");
          return;
        }
        // after revoking referral consent, withdraw the referral itself
        await fetch(`/api/v1/referrals/${referralId}/transitions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
          body: JSON.stringify({ to: "WITHDRAWN_CONSENT", expectedVersion: version }),
        }).catch(() => null);
        router.refresh();
        return;
      }
      if (kind === "cancel") {
        const res = await fetch(`/api/v1/referrals/${referralId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
          body: JSON.stringify({ action: "cancel" }),
        });
        const b = await res.json().catch(() => null);
        if (!res.ok) {
          setError(b?.message ?? "Could not cancel — the referral may have progressed. Refresh to see its current state.");
          return;
        }
        router.refresh();
        return;
      }
      const res = await fetch(`/api/v1/referrals/${referralId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ action: kind === "contact" ? "PATIENT_CONTACT_CONFIRMED" : "FOLLOW_UP_COMPLETED", note: note || undefined }),
      });
      const b = await res.json().catch(() => null);
      if (!res.ok) {
        setError(b?.message ?? "Could not record that.");
        return;
      }
      setNote("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const canReportContact = ["APPOINTMENT_SCHEDULED", "ACKNOWLEDGED", "APPOINTMENT_OFFERED"].includes(state);
  const canConfirmFollowUp = ["FOLLOW_UP_DUE", "CONTACT_CONFIRMED"].includes(state);
  const canCancel = !["CLOSED", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT", "DECLINED", "EXPIRED", "FOLLOW_UP_COMPLETED"].includes(state);

  return (
    <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card" data-testid="referral-actions">
      <h2 className="font-display text-lg font-bold text-moriva-ink">Your updates</h2>
      <p className="mt-1 text-sm text-moriva-slate">
        These are <strong>your own reports</strong> — they are recorded separately from anything the provider confirms.
      </p>
      {(canReportContact || canConfirmFollowUp) && (
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Optional note for yourself (e.g., 'spoke to reception, very helpful')"
          className="mt-3"
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {canReportContact && (
          <Button onClick={() => act("contact")} disabled={busy} className="min-h-11 bg-moriva-teal font-semibold hover:bg-moriva-teal-soft" data-testid="report-contact">
            I contacted them
          </Button>
        )}
        {canConfirmFollowUp && (
          <Button onClick={() => act("followup")} disabled={busy} className="min-h-11 bg-moriva-teal font-semibold hover:bg-moriva-teal-soft" data-testid="confirm-followup">
            Follow-up completed
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => act("cancel")} disabled={busy} className="min-h-11">
            Cancel referral
          </Button>
        )}
        {canCancel && (
          <Button variant="ghost" onClick={() => act("withdraw")} disabled={busy} className="min-h-11 text-state-critical hover:bg-[#FAEBEC]">
            Withdraw consent
          </Button>
        )}
        {!canReportContact && !canConfirmFollowUp && !canCancel && (
          <p className="text-sm text-moriva-slate">This referral is closed. No further actions apply.</p>
        )}
      </div>
      {error && <InlineNotice kind="critical" className="mt-3">{error}</InlineNotice>}
    </div>
  );
}

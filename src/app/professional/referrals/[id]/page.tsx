import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { getAssignedReferral, buildSharedSummary } from "@/domains/professional/service";
import { StatusBadge, SectionHeading } from "@/components/moriva/status";
import { ProfessionalReferralActions } from "@/components/moriva/professional-referral-actions";

export const metadata = { title: "Referral" };
export const dynamic = "force-dynamic";

export default async function ProfessionalReferralPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const referral = await getAssignedReferral(user.id, user.role, id).catch(() => null);
  if (!referral) notFound();
  const summary = buildSharedSummary(referral);

  return (
    <div className="mx-auto max-w-3xl">
      <SectionHeading
        title={`${`Participant ${referral.user.displayName.slice(-2)}`} — ${referral.providerService.serviceName}`}
        description={`${referral.providerService.provider.displayName} · created ${new Date(referral.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}
        level={1}
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={referral.state === "PENDING_PROVIDER_ACKNOWLEDGEMENT" ? "warning" : "teal"}>{referral.state.replace(/_/g, " ").toLowerCase()}</StatusBadge>
        <StatusBadge tone={referral.consentEvent?.status === "GRANTED" ? "success" : "critical"}>
          consent: {(referral.consentEvent?.status ?? "unknown").toLowerCase()}
        </StatusBadge>
        {referral.providerService.provider.demoData && <StatusBadge tone="coral">SIMULATED</StatusBadge>}
      </div>

      <section className="mt-4 rounded-2xl border border-moriva-line bg-white p-6 shadow-card" aria-labelledby="shared">
        <h2 id="shared" className="font-display text-lg font-bold text-moriva-ink">Consent-scoped summary</h2>
        <p className="mt-1 text-xs text-moriva-slate">Only the fields the person consented to share are shown. Individual questionnaire answers are never exposed here.</p>
        <dl className="mt-3 space-y-2 text-sm">
          {Object.entries(summary.summary).length === 0 && <p className="text-moriva-slate">No shared fields recorded.</p>}
          {Object.entries(summary.summary).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-muted px-3 py-2">
              <dt className="text-xs font-semibold uppercase text-moriva-slate">{k}</dt>
              <dd className="font-medium text-moriva-ink">{v}</dd>
            </div>
          ))}
        </dl>
        {summary.clinicalNotes.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-bold text-moriva-ink">Clinical notes</h3>
            <ul className="mt-1 space-y-1 text-sm text-moriva-slate">
              {summary.clinicalNotes.map((n, i) => <li key={i} className="rounded-lg border border-moriva-line px-3 py-2">{n.body}</li>)}
            </ul>
          </div>
        )}
      </section>

      <ProfessionalReferralActions
        referralId={referral.id}
        state={referral.state}
        version={referral.version}
      />

      <section className="mt-4 rounded-2xl border border-moriva-line bg-white p-6 shadow-card" aria-labelledby="events">
        <h2 id="events" className="font-display text-lg font-bold text-moriva-ink">Event history</h2>
        <ol className="mt-3 space-y-2">
          {referral.events.map((e) => (
            <li key={e.id} className="border-l-2 border-moriva-mist pl-3 text-sm">
              <p className="font-medium text-moriva-ink">
                {e.eventType.replace(/_/g, " ").toLowerCase()}{e.toState ? ` → ${e.toState.replace(/_/g, " ").toLowerCase()}` : ""}
              </p>
              <p className="text-xs text-moriva-slate">
                {new Date(e.occurredAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {e.actorType.toLowerCase().replace(/_/g, " ")}
                {e.evidenceSource ? ` · evidence: ${e.evidenceSource.toLowerCase().replace(/_/g, " ")}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

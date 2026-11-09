import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/domains/identity/service";
import { listUserReferrals } from "@/domains/referrals/service";
import { SectionHeading, StatusBadge, EmptyState } from "@/components/moriva/status";

export const metadata = { title: "Referrals" };
export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, "success" | "warning" | "teal" | "neutral" | "critical"> = {
  PENDING_PROVIDER_ACKNOWLEDGEMENT: "warning",
  ACKNOWLEDGED: "teal",
  NEEDS_INFORMATION: "warning",
  APPOINTMENT_SCHEDULED: "success",
  CONTACT_CONFIRMED: "success",
  FOLLOW_UP_DUE: "teal",
  FOLLOW_UP_COMPLETED: "success",
  DECLINED: "neutral",
  CLOSED: "neutral",
  CANCELLED_BY_USER: "neutral",
  WITHDRAWN_CONSENT: "neutral",
  EXPIRED: "neutral",
};

export default async function ReferralsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { items: referrals } = await listUserReferrals(user.id, { limit: 50 });

  return (
    <div>
      <SectionHeading
        title="Your referrals"
        description="A referral being created is not the same as care received. This list shows exactly where each one stands, and which events are provider-confirmed, patient-reported or simulated."
        level={1}
      />
      {referrals.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No referrals yet">
            You can create one from any provider profile after seeing exactly what would be shared.{" "}
            <Link href="/app/providers" className="font-semibold text-moriva-teal underline-offset-4 hover:underline">Browse providers</Link>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" data-testid="referral-list">
          {referrals.map((r) => {
            const last = r.events[r.events.length - 1];
            return (
              <li key={r.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-base font-bold text-moriva-ink">
                      <Link href={`/app/referrals/${r.id}`} className="hover:text-moriva-teal">{r.providerService.serviceName}</Link>
                    </h2>
                    <p className="text-sm text-moriva-slate">{r.providerService.provider.displayName} · {r.providerService.location}</p>
                    <p className="mt-1 text-xs text-moriva-slate">Created {new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge tone={STATE_TONE[r.state] ?? "neutral"}>{r.state.replace(/_/g, " ").toLowerCase()}</StatusBadge>
                    {r.providerService.provider.demoData && <StatusBadge tone="coral">SIMULATED PROVIDER</StatusBadge>}
                  </div>
                </div>
                {last && (
                  <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-moriva-slate">
                    Latest: {last.eventType.replace(/_/g, " ").toLowerCase()}
                    {last.evidenceSource ? ` · evidence: ${last.evidenceSource.replace(/_/g, " ").toLowerCase()}` : ""}
                    {` · ${new Date(last.occurredAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}
                  </p>
                )}
                <Link href={`/app/referrals/${r.id}`} className="mt-3 inline-block min-h-11 rounded-lg border border-moriva-teal px-4 py-2 text-sm font-semibold leading-6 text-moriva-teal hover:bg-secondary">
                  Open timeline
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

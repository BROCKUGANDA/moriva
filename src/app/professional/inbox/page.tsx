import { getSessionUser } from "@/domains/identity/service";
import { listAssignedReferrals } from "@/domains/professional/service";
import { StatusBadge, EmptyState, SectionHeading } from "@/components/moriva/status";
import { ProfessionalReferralList } from "@/components/moriva/professional-referral-list";
import { redirect } from "next/navigation";

export const metadata = { title: "Referral inbox" };
export const dynamic = "force-dynamic";

export default async function ProfessionalInboxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const rows = await listAssignedReferrals(user.id);

  const byState = (s: string) => {
    if (s === "PENDING_PROVIDER_ACKNOWLEDGEMENT") return "new";
    if (["ACKNOWLEDGED", "APPOINTMENT_OFFERED", "APPOINTMENT_SCHEDULED"].includes(s)) return "acknowledged";
    if (s === "NEEDS_INFORMATION") return "needs-info";
    if (s === "DECLINED" || s === "CLOSED" || s === "CANCELLED_BY_USER" || s === "WITHDRAWN_CONSENT") return "closed";
    return "other";
  };
  const tabs = [
    { key: "new", label: "New", rows: rows.filter((r) => byState(r.state) === "new") },
    { key: "acknowledged", label: "Acknowledged", rows: rows.filter((r) => byState(r.state) === "acknowledged") },
    { key: "needs-info", label: "Needs information", rows: rows.filter((r) => byState(r.state) === "needs-info") },
    { key: "closed", label: "Closed", rows: rows.filter((r) => byState(r.state) === "closed") },
  ];

  return (
    <div>
      <SectionHeading
        title="Referral inbox"
        description="Assigned referrals only. Data-sharing scope and consent status are shown before you open anything."
        level={1}
      />
      {rows.length === 0 ? (
        <EmptyState title="No referrals assigned">
          When someone creates a referral to a simulated demo service, it lands here. Try the full journey from an
          individual demo account.
        </EmptyState>
      ) : (
        <ProfessionalReferralList tabs={tabs.map((t) => ({ ...t, rows: t.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), lastEvent: r.lastEvent ? { toState: r.lastEvent.toState, occurredAt: r.lastEvent.occurredAt.toISOString() } : null })) }))} />
      )}
    </div>
  );
}

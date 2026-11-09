import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { SectionHeading, StatusBadge, EmptyState } from "@/components/moriva/status";

export const metadata = { title: "Follow-ups" };
export const dynamic = "force-dynamic";

export default async function FollowUpsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const assignments = await db.referralAssignment.findMany({
    where: { professionalId: user.id, revokedAt: null },
    include: {
      referral: {
        include: { followUps: { orderBy: { dueAt: "desc" } }, providerService: true },
      },
    },
  });
  const followUps = assignments.flatMap((a) => a.referral.followUps.map((f) => ({ ...f, referral: a.referral })));
  const overdue = followUps.filter((f) => f.status === "DUE" && f.dueAt.getTime() < Date.now());

  return (
    <div>
      <SectionHeading
        title="Follow-up queue"
        description="A reminder sent is not a successful care contact. Completed follow-ups show their evidence source."
        level={1}
      />
      {followUps.length === 0 ? (
        <EmptyState title="No follow-ups yet">Follow-ups appear after a contact is confirmed on a referral.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {followUps.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-moriva-line bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-moriva-ink">{f.referral.providerService.serviceName}</p>
                <p className="text-xs text-moriva-slate">Due {new Date(f.dueAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}{overdue.includes(f) ? " · overdue" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={f.status === "COMPLETED" ? "success" : overdue.includes(f) ? "warning" : "teal"}>{f.status.toLowerCase()}</StatusBadge>
                <StatusBadge tone="neutral">{f.evidenceSource.toLowerCase().replace(/_/g, " ")}</StatusBadge>
                <Link href={`/professional/referrals/${f.referralId}`} className="min-h-11 rounded-lg border border-moriva-teal px-3 py-2 text-xs font-semibold text-moriva-teal hover:bg-secondary">Open</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

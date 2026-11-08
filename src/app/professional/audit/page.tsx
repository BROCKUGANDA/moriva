import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { SectionHeading, EmptyState } from "@/components/moriva/status";

export const metadata = { title: "My audit trail" };
export const dynamic = "force-dynamic";

export default async function ProfessionalAuditPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const events = await db.auditEvent.findMany({
    where: { actorId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <SectionHeading
        title="My access history"
        description="Every referral you opened or acted on is logged with time and outcome. This cannot be edited."
        level={1}
      />
      {events.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-moriva-line bg-white px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-moriva-ink">{e.action.toLowerCase().replace(/_/g, " ")} · {e.resourceType.toLowerCase()}</p>
                <p className="text-xs text-moriva-slate">{new Date(e.occurredAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <span className={`text-xs font-bold ${e.outcome === "ALLOW" ? "text-state-success" : e.outcome === "DENY" ? "text-state-warning" : "text-state-critical"}`}>{e.outcome.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

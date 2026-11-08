import { db } from "@/lib/db";
import { SectionHeading, StatusBadge } from "@/components/moriva/status";

export const metadata = { title: "Audit" };
export const dynamic = "force-dynamic";

export default async function OpsAuditPage() {
  const events = await db.auditEvent.findMany({ orderBy: { occurredAt: "desc" }, take: 150 });

  return (
    <div>
      <SectionHeading
        title="Security & governance audit"
        description="Append-only trail of sensitive reads, consent changes, referrals, verification and configuration actions. Ordinary roles cannot mutate or delete these records."
        level={1}
      />
      <div className="mt-4 overflow-x-auto rounded-2xl border border-moriva-line bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-moriva-line bg-muted/60 text-xs uppercase tracking-wide text-moriva-slate">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Actor role</th>
              <th className="px-4 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-moriva-line/60 last:border-0">
                <td className="px-4 py-2.5 text-moriva-slate">{new Date(e.occurredAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-4 py-2.5 font-medium text-moriva-ink">{e.action.toLowerCase().replace(/_/g, " ")}</td>
                <td className="px-4 py-2.5 text-moriva-slate">{e.resourceType.toLowerCase()}{e.resourceId ? ` · ${e.resourceId.slice(-6)}` : ""}</td>
                <td className="px-4 py-2.5 text-moriva-slate">{e.actorRole?.toLowerCase().replace(/_/g, " ") ?? "—"}</td>
                <td className="px-4 py-2.5"><StatusBadge tone={e.outcome === "ALLOW" ? "success" : e.outcome === "DENY" ? "warning" : "critical"}>{e.outcome.toLowerCase()}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

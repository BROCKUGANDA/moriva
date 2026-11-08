import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { SectionHeading, EmptyState } from "@/components/moriva/status";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const rows = await db.notification.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: "desc" }, take: 50 });

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading
        title="Notifications"
        description="Neutral by design: notifications say “You have an update in MORIVA”, never what the update is about."
        level={1}
      />
      {rows.length === 0 ? (
        <EmptyState title="Nothing here yet">Reminders you enable will appear here.</EmptyState>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((n) => (
            <li key={n.id} className="flex items-center justify-between rounded-xl border border-moriva-line bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-moriva-ink">
                  {(() => { try { const p = JSON.parse(n.nonSensitivePayload); return p.message ?? "You have an update in MORIVA"; } catch { return "You have an update in MORIVA"; } })()}
                </p>
                <p className="text-xs text-moriva-slate">{n.scheduledAt ? new Date(n.scheduledAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""} · {n.purpose.toLowerCase().replace(/_/g, " ")}</p>
              </div>
              <span className="text-xs font-semibold text-moriva-slate">{n.status.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

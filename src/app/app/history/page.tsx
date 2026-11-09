import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { listUserSessions } from "@/domains/assessment/service";
import { db } from "@/lib/db";
import { SectionHeading, StatusBadge, EmptyState } from "@/components/moriva/status";
import Link from "next/link";

export const metadata = { title: "History" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { items: sessions } = await listUserSessions(user.id, { limit: 50 });
  const checkIns = await db.notification.findMany({ where: { userId: user.id, purpose: "CHECK_IN" }, orderBy: { sentAt: "desc" }, take: 20 });

  return (
    <div>
      <SectionHeading title="Your history" description="Private to you. Nothing here is visible to anyone else, and nothing is compared or ranked." level={1} />
      <section className="mt-4" aria-labelledby="h-assessments">
        <h2 id="h-assessments" className="font-display text-lg font-bold text-moriva-ink">Assessments</h2>
        {sessions.length === 0 ? (
          <div className="mt-3"><EmptyState title="No assessments yet">When you complete one, it appears here with its version and date.</EmptyState></div>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-moriva-line bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-moriva-ink">{s.instrumentVersion.instrument.displayName} <span className="font-normal text-moriva-slate">v{s.instrumentVersion.version}</span></p>
                  <p className="text-xs text-moriva-slate">{s.completedAt ? new Date(s.completedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : new Date(s.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={s.status === "SCORED" ? "success" : "neutral"}>{s.status}</StatusBadge>
                  {s.status === "IN_PROGRESS" ? <Link href={`/app/assessments/${s.id}`} className="text-sm font-semibold text-moriva-teal underline-offset-4 hover:underline">Resume</Link> : s.status === "SCORED" ? <Link href={`/app/assessments/${s.id}/result`} className="text-sm font-semibold text-moriva-teal underline-offset-4 hover:underline">Result</Link> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-8" aria-labelledby="h-checkins">
        <h2 id="h-checkins" className="font-display text-lg font-bold text-moriva-ink">Quick check-ins</h2>
        {checkIns.length === 0 ? (
          <p className="mt-2 text-sm text-moriva-slate">No quick check-ins yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {checkIns.map((c) => {
              let tag = "";
              try { tag = JSON.parse(c.nonSensitivePayload).tag ?? ""; } catch {}
              return (
                <li key={c.id} className="rounded-full bg-muted px-3 py-1.5 text-xs text-moriva-slate">
                  {tag} · {c.sentAt ? new Date(c.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-moriva-slate">Quick tags are notes, not scores — they are never calculated or shared.</p>
      </section>
    </div>
  );
}

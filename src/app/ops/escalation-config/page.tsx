import { db } from "@/lib/db";
import { SectionHeading, StatusBadge, InlineNotice } from "@/components/moriva/status";

export const metadata = { title: "Escalation configuration" };
export const dynamic = "force-dynamic";

export default async function OpsEscalationPage() {
  const rows = await db.safetyResourceConfig.findMany({ orderBy: [{ regionCode: "asc" }, { version: "desc" }] });
  const safetyEvents = await db.safetyEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div>
      <SectionHeading
        title="Escalation configuration"
        description="Region contacts with source, verification date and expiry. Expired contacts trigger an internal alert and the safe fallback copy — never an invented replacement number."
        level={1}
      />
      <div className="space-y-3">
        {rows.map((r) => {
          const expired = r.expiresAt ? r.expiresAt.getTime() < Date.now() : false;
          return (
            <article key={r.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-moriva-ink">{r.contactName} · {r.contactPhone}</h2>
                <div className="flex gap-2">
                  <StatusBadge tone={r.isEmergency ? "critical" : "teal"}>{r.contactPurpose.toLowerCase().replace(/_/g, " ")}</StatusBadge>
                  <StatusBadge tone={expired ? "warning" : "success"}>{expired ? "PAST RE-CHECK DATE" : "verified"}</StatusBadge>
                </div>
              </div>
              <p className="mt-1 text-xs text-moriva-slate">
                Region {r.regionCode} · config v{r.version} · source: <a href={r.sourceUrl} className="underline underline-offset-2" rel="noreferrer noopener">{r.sourceOrg}</a> ·
                last verified {new Date(r.lastVerifiedAt).toLocaleDateString("en-GB")} · re-check due {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString("en-GB") : "—"}
              </p>
              <p className="mt-2 text-sm text-moriva-ink/85">{r.notesEn}</p>
            </article>
          );
        })}
      </div>
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-moriva-ink">Recent safety events (restricted)</h2>
        <p className="mt-1 text-xs text-moriva-slate">Minimum-necessary metadata only — no user text is recorded on safety events.</p>
        {safetyEvents.length === 0 ? (
          <p className="mt-2 text-sm text-moriva-slate">No safety events recorded.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {safetyEvents.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-moriva-line bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-moriva-ink">{e.sourceType.toLowerCase().replace(/_/g, " ")} · {e.triggerCode}</p>
                  <p className="text-xs text-moriva-slate">{new Date(e.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · region {e.regionCode} · config v{e.configVersion}</p>
                </div>
                <StatusBadge tone={e.eventStatus === "OPEN" ? "warning" : "neutral"}>{e.eventStatus.toLowerCase()}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

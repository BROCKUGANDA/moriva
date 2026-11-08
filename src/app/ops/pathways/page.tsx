import { db } from "@/lib/db";
import { SectionHeading, StatusBadge, InlineNotice } from "@/components/moriva/status";

export const metadata = { title: "Pathway rules" };
export const dynamic = "force-dynamic";

export default async function OpsPathwaysPage() {
  const rules = await db.pathwayRule.findMany({ orderBy: { effectiveAt: "desc" } });

  return (
    <div>
      <SectionHeading
        title="Pathway rules"
        description="Deterministic, versioned rule bundles with content hash, approver and expiry. Rule changes require clinical governance approval — the shipped bundle is marked DEMO_APPROVED."
        level={1}
      />
      <InlineNotice kind="warning" className="mb-4">
        Demonstration rules only — thresholds exercise the engine; they are not clinically approved triage criteria.
      </InlineNotice>
      <div className="space-y-3">
        {rules.map((r) => {
          const bundle = JSON.parse(r.rulesJson) as { bundles: Array<{ id: string; rationaleCode: string; when: { kind: string } }> };
          return (
            <article key={r.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-moriva-ink">Rules v{r.version} · {r.jurisdiction}</h2>
                <div className="flex gap-2">
                  <StatusBadge tone={r.status === "APPROVED" ? "success" : "warning"}>{r.status}</StatusBadge>
                  <StatusBadge tone="neutral">expires {r.expiryAt ? new Date(r.expiryAt).toLocaleDateString("en-GB") : "—"}</StatusBadge>
                </div>
              </div>
              <p className="mt-1 text-xs text-moriva-slate">Approver: {r.clinicalApproverId} · approved {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString("en-GB") : "—"} · content hash {r.contentHash.slice(0, 16)}…</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {bundle.bundles.map((b) => (
                  <li key={b.id} className="rounded-lg bg-muted px-3 py-2 text-xs">
                    <span className="font-semibold text-moriva-ink">{b.id}</span> · when {b.when.kind.toLowerCase().replace(/_/g, " ")} · {b.rationaleCode}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}

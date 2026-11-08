import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { SectionHeading, StatusBadge, InlineNotice } from "@/components/moriva/status";

export const metadata = { title: "System" };
export const dynamic = "force-dynamic";

export default async function OpsSystemPage() {
  const env = getEnv();
  const flags = await db.featureFlag.findMany();
  const outbox = await db.outboxEvent.findMany({ where: { status: { in: ["PENDING", "DEAD_LETTER"] } }, orderBy: { createdAt: "desc" }, take: 20 });
  let dbOk = true;
  try { await db.$queryRaw`SELECT 1`; } catch { dbOk = false; }

  return (
    <div>
      <SectionHeading title="System health" description="Runtime health, feature flags and outbox status." level={1} />
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-moriva-ink">Environment</h2>
          <dl className="mt-2 text-sm">
            <div className="flex justify-between border-b border-moriva-line py-2"><dt className="text-moriva-slate">NODE_ENV</dt><dd className="font-medium">{env.nodeEnv}</dd></div>
            <div className="flex justify-between border-b border-moriva-line py-2"><dt className="text-moriva-slate">Demo mode</dt><dd className="font-medium">{env.demoMode ? "enabled (synthetic data only)" : "disabled"}</dd></div>
            <div className="flex justify-between border-b border-moriva-line py-2"><dt className="text-moriva-slate">AI reflection</dt><dd className="font-medium">disabled by ADR-0005 (fail-closed)</dd></div>
            <div className="flex justify-between border-b border-moriva-line py-2"><dt className="text-moriva-slate">Small-cell threshold</dt><dd className="font-medium">{env.smallCellThreshold}</dd></div>
            <div className="flex justify-between py-2"><dt className="text-moriva-slate">Database</dt><dd className="font-medium">{dbOk ? "reachable" : "unreachable"}</dd></div>
          </dl>
          <InlineNotice kind="info" className="mt-3" title="External integrations">
            None. No provider API, EHR/FHIR connection, notification transport or AI provider is connected — adapters
            exist only as documented interfaces.
          </InlineNotice>
        </article>
        <article className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-bold text-moriva-ink">Feature flags</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {flags.map((f) => (
              <li key={f.key} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <span className="font-medium text-moriva-ink">{f.key}</span>
                <StatusBadge tone={f.enabled ? "success" : "neutral"}>{f.enabled ? "on" : "off"}</StatusBadge>
              </li>
            ))}
          </ul>
        </article>
      </div>
      <article className="mt-4 rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-moriva-ink">Outbox (pending / dead-letter)</h2>
        {outbox.length === 0 ? (
          <p className="mt-2 text-sm text-moriva-slate">No pending or dead-lettered events.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {outbox.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
                <span className="font-medium text-moriva-ink">{o.eventType} · {o.aggregateType} {o.aggregateId.slice(-6)}</span>
                <span className="text-xs text-moriva-slate">{o.status.toLowerCase()} · attempts {o.attempts}{o.lastError ? ` · ${o.lastError.slice(0, 60)}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

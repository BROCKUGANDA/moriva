import Link from "next/link";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { outcomesDashboard } from "@/domains/analytics/service";
import { SectionHeading, StatusBadge, InlineNotice } from "@/components/moriva/status";
import { OutcomesPanel } from "@/components/moriva/outcomes-panel";

export const metadata = { title: "Operations overview" };
export const dynamic = "force-dynamic";

export default async function OpsOverviewPage() {
  const env = getEnv();
  const [providers, pendingVerifications, expiredConfigs, outboxPending, deadLetters, instruments, safetyEvents, users] = await Promise.all([
    db.provider.count(),
    db.provider.count({ where: { verificationStatus: "PENDING" } }),
    db.provider.count({ where: { recheckDueAt: { lt: new Date() } } }),
    db.outboxEvent.count({ where: { status: "PENDING" } }),
    db.outboxEvent.count({ where: { status: "DEAD_LETTER" } }),
    db.instrument.findMany({ include: { versions: true } }),
    db.safetyEvent.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600_000) } } }),
    db.user.count(),
  ]);
  const outcomes = await outcomesDashboard(env.smallCellThreshold);

  const cards = [
    { label: "Providers listed", value: providers, note: `${pendingVerifications} pending · ${expiredConfigs} past re-check date`, href: "/ops/providers" },
    { label: "Instruments", value: instruments.length, note: instruments.every((i) => i.status === "SIMULATION_ONLY") ? "all SIMULATION_ONLY (no clinical approval)" : "mixed statuses", href: "/ops/instruments" },
    { label: "Safety events (30d)", value: safetyEvents, note: "Help Now opens + urgent-risk answers", href: "/ops/escalation-config" },
    { label: "Outbox backlog", value: outboxPending, note: `${deadLetters} dead-lettered`, href: "/ops/system" },
    { label: "Accounts", value: users, note: "synthetic demo identities", href: "/ops/audit" },
  ];

  return (
    <div>
      <SectionHeading
        title="Operations overview"
        description="System health and aggregate workflow indicators. This workspace shows aggregates — it cannot open journals or unshared assessment answers."
        level={1}
      />
      <InlineNotice kind="warning" title="PROTOTYPE — SIMULATED DATA" className="mb-4">
        Every record in this environment is synthetic. Metrics carry source labels and small-cell suppression.
      </InlineNotice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card hover:border-moriva-teal">
            <p className="text-xs font-semibold uppercase tracking-wide text-moriva-slate">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-moriva-ink">{c.value}</p>
            <p className="mt-1 text-xs text-moriva-slate">{c.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-bold text-moriva-ink">Outcome funnel (30 days)</h2>
        <OutcomesPanel data={outcomes} />
      </div>
    </div>
  );
}

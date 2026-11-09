import { getEnv } from "@/lib/env";
import { outcomesDashboard } from "@/domains/analytics/service";
import { SectionHeading } from "@/components/moriva/status";
import { OutcomesPanel } from "@/components/moriva/outcomes-panel";

export const metadata = { title: "Outcomes" };
export const dynamic = "force-dynamic";

export default async function OpsOutcomesPage() {
  const env = getEnv();
  const data = await outcomesDashboard(env.smallCellThreshold);
  return (
    <div>
      <SectionHeading
        title="Outcomes dashboard"
        description="De-identified workflow outcomes with definitions, numerators, denominators, observation period, evidence sources, missingness and small-cell suppression."
        level={1}
      />
      <OutcomesPanel data={data} />
      <p className="mt-4 text-xs text-moriva-slate">
        No drill-down to named users exists for operational analytics. Equity analysis is a governance-gated diagnostic,
        not a scorecard — it is not enabled in this prototype.
      </p>
    </div>
  );
}

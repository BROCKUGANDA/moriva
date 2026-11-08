"use client";

import { InlineNotice, StatusBadge } from "@/components/moriva/status";

type Metric = {
  key: string;
  definition: string;
  numerator: number | null;
  denominator: number | null;
  suppressed: boolean;
  periodStart: string;
  periodEnd: string;
  sources: string[];
  missingOrUnknown: number;
  note: string;
};

/** Outcome metrics with numerator/denominator/period/source/missingness + suppression labels. */
export function OutcomesPanel({ data }: { data: { metrics: Metric[]; labels: { simulatedData: boolean; note: string } } }) {
  return (
    <div data-testid="outcomes-panel">
      {data.labels.simulatedData && <InlineNotice kind="warning" title="SIMULATED DATA" className="mb-3">{data.labels.note}</InlineNotice>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.metrics.map((m) => {
          const rate = m.numerator !== null && m.denominator ? (m.denominator > 0 ? Math.round((m.numerator / m.denominator) * 100) : null) : null;
          return (
            <article key={m.key} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
              <h3 className="font-display text-sm font-bold text-moriva-ink">{m.definition}</h3>
              {m.suppressed ? (
                <p className="mt-2 rounded-lg bg-[#FBF3E4] px-3 py-2 text-sm font-semibold text-state-warning" title="Small-cell suppression">
                  Suppressed — cohort below the privacy threshold
                </p>
              ) : (
                <p className="mt-2 font-display text-3xl font-extrabold text-moriva-ink">
                  {rate === null ? "—" : `${rate}%`}
                  <span className="ml-2 text-sm font-semibold text-moriva-slate">{m.numerator} / {m.denominator}</span>
                </p>
              )}
              <p className="mt-2 text-xs text-moriva-slate">
                Period: {new Date(m.periodStart).toLocaleDateString("en-GB")} – {new Date(m.periodEnd).toLocaleDateString("en-GB")}
              </p>
              <p className="mt-1 flex flex-wrap gap-1">
                {m.sources.map((s) => <StatusBadge key={s} tone={s === "SIMULATED" ? "coral" : s === "PATIENT_REPORTED" ? "teal" : "neutral"}>{s.toLowerCase().replace(/_/g, " ")}</StatusBadge>)}
              </p>
              <p className="mt-2 text-xs text-moriva-slate">Missing / unknown: {m.missingOrUnknown} (counted as unknown, never as success or failure)</p>
              <p className="mt-1 text-xs text-moriva-slate">{m.note}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

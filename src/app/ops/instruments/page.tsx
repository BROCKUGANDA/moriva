import { db } from "@/lib/db";
import { SectionHeading, StatusBadge, InlineNotice } from "@/components/moriva/status";

export const metadata = { title: "Instrument registry" };
export const dynamic = "force-dynamic";

export default async function OpsInstrumentsPage() {
  const instruments = await db.instrument.findMany({ include: { versions: { include: { items: true } } } });

  return (
    <div>
      <SectionHeading
        title="Instrument registry"
        description="Immutable version metadata: source, rights, checksum, scoring version, approver and validity. Instruments cannot become ACTIVE without clinical approval metadata — which none has in this prototype."
        level={1}
      />
      <InlineNotice kind="warning" title="No clinically approved instrument is active" className="mb-4">
        WHO-5, PHQ and GAD candidates require rights confirmation and clinical review before embedding. The shipped
        instrument is a labelled synthetic simulation (PRD §8.4).
      </InlineNotice>
      <div className="space-y-3">
        {instruments.map((i) => (
          <article key={i.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-moriva-ink">{i.displayName}</h2>
                <p className="text-xs text-moriva-slate">{i.code} · source: {i.ownerSource} · construct: {i.construct} · population: {i.intendedPopulation}</p>
              </div>
              <StatusBadge tone={i.status === "ACTIVE" ? "success" : "coral"}>{i.status}</StatusBadge>
            </div>
            {i.versions.map((v) => (
              <div key={v.id} className="mt-3 rounded-xl bg-muted p-4 text-sm">
                <p className="font-semibold text-moriva-ink">Version {v.version} ({v.locale}) · status {v.status}</p>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-moriva-slate sm:grid-cols-2">
                  <div><dt className="inline font-semibold">Content checksum: </dt><dd className="inline font-mono">{v.contentChecksum.slice(0, 16)}…</dd></div>
                  <div><dt className="inline font-semibold">Scoring version: </dt><dd className="inline">{v.scoringVersion}</dd></div>
                  <div><dt className="inline font-semibold">Licence: </dt><dd className="inline">{v.licenceStatus}</dd></div>
                  <div><dt className="inline font-semibold">Items: </dt><dd className="inline">{v.items.length}</dd></div>
                  <div><dt className="inline font-semibold">Clinical approver: </dt><dd className="inline">{v.clinicalApprover}</dd></div>
                  <div><dt className="inline font-semibold">Effective: </dt><dd className="inline">{new Date(v.effectiveAt).toLocaleDateString("en-GB")}</dd></div>
                </dl>
                <p className="mt-2 text-xs text-moriva-slate">{v.validityNotes}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

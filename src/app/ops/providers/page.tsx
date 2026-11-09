import { db } from "@/lib/db";
import { SectionHeading, VerificationBadge, StatusBadge, InlineNotice } from "@/components/moriva/status";
import { OpsProviderActions } from "@/components/moriva/ops-provider-actions";

export const metadata = { title: "Provider verification" };
export const dynamic = "force-dynamic";

export default async function OpsProvidersPage() {
  const providers = await db.provider.findMany({ include: { services: true, organisation: true }, orderBy: { displayName: "asc" } });

  return (
    <div>
      <SectionHeading
        title="Provider verification"
        description="Verification status, scope and freshness. Expired or suspended providers are excluded from referral results automatically."
        level={1}
      />
      <InlineNotice kind="info" className="mb-4">
        In this prototype every provider is simulated; a real verification requires a named human verifier with source
        evidence (blocked — see implementation status).
      </InlineNotice>
      <div className="space-y-3">
        {providers.map((p) => (
          <article key={p.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-moriva-ink">{p.displayName}</h2>
                <p className="text-xs text-moriva-slate">{p.legalName} · {p.organisation?.name ?? "no organisation"} · {p.jurisdiction}</p>
                <p className="mt-1 text-xs text-moriva-slate">
                  Scope: {p.verificationScope || "—"} · verified {p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString("en-GB") : "never"} · re-check due {p.recheckDueAt ? new Date(p.recheckDueAt).toLocaleDateString("en-GB") : "—"}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1">
                  {p.services.map((s) => (
                    <li key={s.id} className="flex items-center gap-1">
                      <StatusBadge tone={s.status === "ACTIVE" ? "success" : "warning"}>{s.serviceName}: {s.status.toLowerCase()}</StatusBadge>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-end gap-2">
                <VerificationBadge status={p.verificationStatus} demoData={p.demoData} />
                <OpsProviderActions providerId={p.id} current={p.verificationStatus} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

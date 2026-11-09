import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/domains/identity/service";
import { SectionHeading, VerificationBadge, StatusBadge, SimulationBanner } from "@/components/moriva/status";
import { ProviderReferralSection } from "@/components/moriva/provider-referral-section";
import Link from "next/link";

export const metadata = { title: "Provider profile" };
export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const user = await getSessionUser();
  if (!user) return null;
  const service = await db.providerService.findUnique({
    where: { id: providerId },
    include: { provider: true },
  });
  if (!service) notFound();

  const sessions = await db.assessmentSession.findMany({
    where: { userId: user.id, status: "SCORED" },
    orderBy: { completedAt: "desc" },
    include: { result: true, instrumentVersion: { include: { instrument: true } } },
  });

  const referrable = ["VERIFIED", "DEMO_VERIFIED_SIMULATED"].includes(service.provider.verificationStatus) && service.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/providers" className="text-sm text-moriva-slate underline-offset-4 hover:underline">← All providers</Link>
      <SectionHeading title={service.provider.displayName} level={1} />
      <div className="flex flex-wrap items-center gap-2">
        <VerificationBadge
          status={service.provider.verificationStatus}
          demoData={service.provider.demoData}
          lastVerifiedLabel={service.provider.verifiedAt ? `checked ${service.provider.verifiedAt.toISOString().slice(0, 10)}` : undefined}
        />
        <StatusBadge tone="neutral">{service.careLevel.replace("_", " ")}</StatusBadge>
        {service.status !== "ACTIVE" && <StatusBadge tone="warning">{service.status}</StatusBadge>}
      </div>

      {service.provider.demoData && <div className="mt-3"><SimulationBanner /></div>}

      <article className="mt-4 rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
        <h2 className="font-display text-lg font-bold text-moriva-ink">{service.serviceName}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase text-moriva-slate">Location</dt><dd>{service.location}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-moriva-slate">Languages</dt><dd>{service.languages.split("|").join(", ")}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-moriva-slate">Eligibility</dt><dd>{service.eligibility}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-moriva-slate">Accessibility</dt><dd>{service.accessibility || "Not recorded"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-moriva-slate">Availability</dt><dd>Not published — we don't invent availability. Contact the service directly.</dd></div>
          <div>
            <dt className="text-xs font-semibold uppercase text-moriva-slate">Verification</dt>
            <dd>
              {service.provider.verificationScope}
              {service.lastVerifiedAt ? ` · checked ${service.lastVerifiedAt.toISOString().slice(0, 10)}` : ""}
              {service.recheckDueAt ? ` · re-check due ${service.recheckDueAt.toISOString().slice(0, 10)}` : ""}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-moriva-slate">Legal entity: {service.provider.legalName}</p>
      </article>

      <section className="mt-6" aria-labelledby="refer">
        <h2 id="refer" className="font-display text-xl font-bold text-moriva-ink">Request a referral to this service</h2>
        {referrable ? (
          <ProviderReferralSection
            providerServiceId={service.id}
            sessions={sessions.map((s) => ({ id: s.id, name: s.instrumentVersion.instrument.displayName, version: s.instrumentVersion.version, code: s.result?.interpretationCode ?? "", completedAt: s.completedAt?.toISOString() ?? "", resultId: s.result?.id ?? null }))}
          />
        ) : (
          <div className="mt-3 rounded-2xl border border-state-warning/40 bg-[#FBF3E4] p-4 text-sm text-state-warning">
            This service is being re-verified and cannot receive new referrals right now. <Link href="/app/providers" className="font-semibold underline underline-offset-4">View other verified options</Link>.
          </div>
        )}
      </section>
    </div>
  );
}

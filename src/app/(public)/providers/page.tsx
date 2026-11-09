import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { VerificationBadge, DemoBanner } from "@/components/moriva/status";
import { PublicHeader, PublicFooter } from "@/components/navigation/shells";

export const metadata: Metadata = { title: "Provider directory" };
export const dynamic = "force-dynamic";

export default async function PublicProvidersPage() {
  const providers = await db.provider.findMany({
    where: { verificationStatus: "DEMO_VERIFIED_SIMULATED" },
    include: { services: { where: { status: "ACTIVE" } } },
    orderBy: { displayName: "asc" },
  });
  const resources = await db.supportResource.findMany({ where: { status: "ACTIVE" }, orderBy: { titleEn: "asc" } });

  return (
    <>
      <DemoBanner />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <div className="moriva-container py-12 md:py-16">
          <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Provider directory</h1>
          <p className="moriva-reading mt-3 text-base leading-relaxed text-moriva-slate">
            Listings shown to users carry verification status and freshness metadata. Suspended, expired or rejected
            listings are hidden from new referrals. In this prototype every listing is{" "}
            <strong>simulated demo data</strong> — no real provider is listed and none can be contacted through MORIVA.
          </p>

          <section aria-labelledby="demo-listings" className="mt-8">
            <h2 id="demo-listings" className="font-display text-xl font-bold text-moriva-ink">Listings</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {providers.map((p) => (
                <article key={p.id} className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-moriva-ink">{p.displayName}</h3>
                    <VerificationBadge
                      status={p.verificationStatus}
                      demoData={p.demoData}
                      lastVerifiedLabel={p.verifiedAt ? `checked ${p.verifiedAt.toISOString().slice(0, 10)}` : undefined}
                    />
                  </div>
                  <p className="mt-1 text-xs text-moriva-slate">{p.legalName} · {p.jurisdiction}</p>
                  <ul className="mt-3 space-y-2">
                    {p.services.map((s) => (
                      <li key={s.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                        <span className="font-semibold text-moriva-ink">{s.serviceName}</span>
                        <span className="block text-xs text-moriva-slate">
                          {s.careLevel.replace("_", "-").toLowerCase()} · languages: {s.languages.split("|").join(", ")} · {s.location}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="resources" className="mt-10">
            <h2 id="resources" className="font-display text-xl font-bold text-moriva-ink">Information & community resources</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {resources.map((r) => (
                <article key={r.id} className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wide text-moriva-teal">{r.resourceType.replace("_", " ")}</p>
                  <h3 className="mt-1 font-semibold text-moriva-ink">{r.titleEn}</h3>
                  <p className="mt-1 text-xs text-moriva-slate">{r.sourceOrg} · eligibility: {r.eligibility}</p>
                </article>
              ))}
            </div>
          </section>

          <p className="mt-8 text-sm text-moriva-slate">
            Want the full journey with consent-controlled referrals? <Link href="/register" className="font-semibold text-moriva-teal underline-offset-4 hover:underline">Create a demo account →</Link>
          </p>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

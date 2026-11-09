/**
 * directory domain — provider/service discovery with verification states (PRD §13.5, Phase 5.3).
 * Search excludes suspended/expired/rejected listings. No fabricated availability or prices.
 */
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

const REFERRABLE_STATUSES = ["VERIFIED", "DEMO_VERIFIED_SIMULATED"];

export async function searchProviders(filter: {
  limit?: number;
  cursor?: string | null;
  q?: string;
  careLevel?: string;
  language?: string;
  includeNonReferrable?: boolean;
}) {
  const serviceWhere: Record<string, unknown> = {};
  if (filter.careLevel) serviceWhere.careLevel = filter.careLevel;
  if (filter.language) serviceWhere.languages = { contains: filter.language };

  const limit = Math.min(100, Math.max(1, filter.limit ?? 20));
  const providers = await db.provider.findMany({
    where: {
      ...(filter.includeNonReferrable ? {} : { verificationStatus: { in: REFERRABLE_STATUSES } }),
      ...(filter.cursor ? { displayName: { gt: filter.cursor } } : {}),
    },
    include: { services: { where: filter.includeNonReferrable ? {} : { status: "ACTIVE" } } },
    orderBy: { displayName: "asc" },
    take: limit + 1,
  });
  const hasMore = providers.length > limit;
  const pageProviders = hasMore ? providers.slice(0, limit) : providers;

  const q = filter.q?.trim().toLowerCase();
  const mapped = pageProviders
    .map((p) => ({
      id: p.id,
      displayName: p.displayName,
      legalName: p.legalName,
      jurisdiction: p.jurisdiction,
      verificationStatus: p.verificationStatus,
      verificationScope: p.verificationScope,
      verifiedAt: p.verifiedAt,
      recheckDueAt: p.recheckDueAt,
      demoData: p.demoData,
      services: p.services
        .filter((s) => (q ? (s.serviceName.toLowerCase().includes(q) || s.eligibility.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q)) : true))
        .map((s) => ({
          id: s.id,
          serviceCode: s.serviceCode,
          serviceName: s.serviceName,
          careLevel: s.careLevel,
          languages: s.languages.split("|"),
          eligibility: s.eligibility,
          accessibility: s.accessibility,
          location: s.location,
          availabilitySource: s.availabilitySource, // never fabricated
          status: s.status,
          lastVerifiedAt: s.lastVerifiedAt,
          recheckDueAt: s.recheckDueAt,
          referrable: REFERRABLE_STATUSES.includes(p.verificationStatus) && s.status === "ACTIVE",
        })),
    }))
    .filter((p) => p.services.length > 0);
  return { items: mapped, nextCursor: hasMore ? pageProviders[pageProviders.length - 1].displayName : null, hasMore };
}

export async function getProvider(providerId: string) {
  const provider = await db.provider.findUnique({
    where: { id: providerId },
    include: { services: true },
  });
  if (!provider) throw new MorivaError("RESOURCE_NOT_FOUND");
  return provider;
}

/** Referral eligibility check — used by the referral service (fail closed). */
export async function assertReferrableService(providerServiceId: string) {
  const service = await db.providerService.findUnique({
    where: { id: providerServiceId },
    include: { provider: true },
  });
  if (!service) throw new MorivaError("RESOURCE_NOT_FOUND");
  const referrable =
    REFERRABLE_STATUSES.includes(service.provider.verificationStatus) &&
    service.status === "ACTIVE" &&
    (!service.recheckDueAt || service.recheckDueAt.getTime() >= Date.now());
  if (service.provider.verificationStatus === "EXPIRED" || (service.recheckDueAt && service.recheckDueAt.getTime() < Date.now())) {
    throw new MorivaError("PROVIDER_SERVICE_EXPIRED");
  }
  if (!referrable) {
    throw new MorivaError("PROVIDER_UNVERIFIED");
  }
  return service;
}

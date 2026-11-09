import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

/** Provider service detail (used by support option cards). Ownership not required — directory data is non-sensitive. */
export const GET = withApi({ rate: "read" })(async ({ params, requestId }) => {
  await requireUser();
  const s = await db.providerService.findUnique({
    where: { id: params.id },
    include: { provider: true },
  });
  if (!s) throw new MorivaError("RESOURCE_NOT_FOUND");
  return jsonOk(
    {
      service: {
        id: s.id,
        serviceName: s.serviceName,
        careLevel: s.careLevel,
        languages: s.languages.split("|"),
        eligibility: s.eligibility,
        accessibility: s.accessibility,
        location: s.location,
        status: s.status,
        providerDisplayName: s.provider.displayName,
        providerId: s.provider.id,
        verificationStatus: s.provider.verificationStatus,
        simulated: s.provider.demoData,
        lastVerifiedAt: s.lastVerifiedAt,
        recheckDueAt: s.recheckDueAt,
      },
    }, requestId
  );
});

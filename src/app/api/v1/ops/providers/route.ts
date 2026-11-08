import { withApi, jsonOk } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { db } from "@/lib/db";

/** GET — all provider listings incl. non-referrable, with verification freshness. */
export const GET = withApi({ rate: "read" })(async () => {
  await requireRole("OPS_ADMIN_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED");
  const providers = await db.provider.findMany({
    include: { services: true, organisation: true },
    orderBy: { displayName: "asc" },
  });
  return jsonOk(
    {
      providers: providers.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        legalName: p.legalName,
        verificationStatus: p.verificationStatus,
        verificationScope: p.verificationScope,
        verifiedAt: p.verifiedAt,
        recheckDueAt: p.recheckDueAt,
        demoData: p.demoData,
        org: p.organisation?.name ?? null,
        services: p.services.map((s) => ({ id: s.id, serviceName: s.serviceName, status: s.status, careLevel: s.careLevel })),
      })),
    },
    ""
  );
});

import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { getProvider } from "@/domains/directory/service";

export const GET = withApi({ rate: "read" })(async ({ params }) => {
  await requireUser();
  const p = await getProvider(params.id);
  return jsonOk(
    {
      provider: {
        id: p.id,
        displayName: p.displayName,
        legalName: p.legalName,
        jurisdiction: p.jurisdiction,
        verificationStatus: p.verificationStatus,
        verificationScope: p.verificationScope,
        verifiedAt: p.verifiedAt,
        recheckDueAt: p.recheckDueAt,
        demoData: p.demoData,
        services: p.services.map((s) => ({
          id: s.id,
          serviceName: s.serviceName,
          serviceCode: s.serviceCode,
          careLevel: s.careLevel,
          languages: s.languages.split("|"),
          eligibility: s.eligibility,
          accessibility: s.accessibility,
          location: s.location,
          availabilitySource: s.availabilitySource,
          status: s.status,
          referrable: ["VERIFIED", "DEMO_VERIFIED_SIMULATED"].includes(p.verificationStatus) && s.status === "ACTIVE",
        })),
      },
    },
    ""
  );
});

import { withApi, jsonOk } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { PROFESSIONAL_ROLES, getAssignedReferral, buildSharedSummary } from "@/domains/professional/service";

/**
 * GET — consent-scoped referral detail for the assigned professional.
 * Only shared/assigned data is returned; the shared summary is minimum-necessary.
 */
export const GET = withApi({ rate: "read" })(async ({ params, requestId }) => {
  const user = await requireRole(...PROFESSIONAL_ROLES);
  const referral = await getAssignedReferral(user.id, user.role, params.id);
  const summary = buildSharedSummary(referral);
  return jsonOk(
    {
      simulatedWorkspace: true,
      referral: {
        id: referral.id,
        state: referral.state,
        version: referral.version,
        patientAlias: `Participant ${referral.user.displayName.slice(-2)}`,
        serviceName: referral.providerService.serviceName,
        providerName: referral.providerService.provider.displayName,
        simulated: referral.providerService.provider.demoData,
        consent: {
          status: referral.consentEvent?.status ?? "UNKNOWN",
          purpose: referral.consentEvent?.purposeCode ?? null,
          grantedAt: referral.consentEvent?.grantedAt ?? null,
          dataCategories: (referral.consentEvent?.dataCategories ?? "").split("|").filter(Boolean),
        },
        sharedFields: referral.sharedFields.split("|").filter(Boolean),
        sharedSummary: summary,
        events: referral.events.map((e) => ({
          id: e.id, eventType: e.eventType, fromState: e.fromState, toState: e.toState,
          actorType: e.actorType, evidenceSource: e.evidenceSource, safeReasonCode: e.safeReasonCode,
          noteClass: e.noteClass, occurredAt: e.occurredAt,
        })),
      },
    }, requestId
  );
});

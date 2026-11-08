import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { getOwnedReferral, transitionReferral } from "@/domains/referrals/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

/** Referral detail for its owner — includes the full event timeline with evidence sources. */
export const GET = withApi({ rate: "read" })(async ({ params }) => {
  const user = await requireUser();
  const r = await db.referral.findUnique({
    where: { id: params.id },
    include: {
      providerService: { include: { provider: true } },
      events: { orderBy: { occurredAt: "asc" } },
      assignments: true,
    },
  });
  if (!r || r.userId !== user.id) throw new MorivaError("RESOURCE_NOT_FOUND");
  const consent = await db.consentEvent.findUnique({ where: { id: r.consentEventId } });
  return jsonOk(
    {
      referral: {
        id: r.id,
        state: r.state,
        version: r.version,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        provider: {
          id: r.providerService.provider.id,
          displayName: r.providerService.provider.displayName,
          verificationStatus: r.providerService.provider.verificationStatus,
          demoData: r.providerService.provider.demoData,
        },
        service: {
          id: r.providerService.id,
          serviceName: r.providerService.serviceName,
          careLevel: r.providerService.careLevel,
          location: r.providerService.location,
        },
        sharedFields: r.sharedFields.split("|").filter(Boolean),
        consent: consent
          ? { id: consent.id, purpose: consent.purposeCode, grantedAt: consent.grantedAt, status: consent.status, expiresAt: consent.expiresAt }
          : null,
        events: r.events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          fromState: e.fromState,
          toState: e.toState,
          actorType: e.actorType,
          evidenceSource: e.evidenceSource,
          safeReasonCode: e.safeReasonCode,
          noteClass: e.noteClass,
          occurredAt: e.occurredAt,
        })),
      },
    },
    ""
  );
});

const CancelBody = z.object({ action: z.literal("cancel") });

/** User-initiated cancel (CANCELLED_BY_USER). */
export const PATCH = withApi({ rate: "write", csrf: true })(async ({ req, params }) => {
  const user = await requireUser();
  const parsed = CancelBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const r = await getOwnedReferral(user.id, params.id);
  const outcome = await transitionReferral({
    referralId: r.id,
    to: "CANCELLED_BY_USER",
    actor: { userId: user.id, role: user.role },
    expectedVersion: r.version,
  });
  return jsonOk({ state: outcome.to, version: outcome.referral.version }, "");
});

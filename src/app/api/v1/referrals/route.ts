import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { createReferral, listUserReferrals } from "@/domains/referrals/service";
import { MorivaError } from "@/lib/errors";

const CreateBody = z.object({
  providerServiceId: z.string().min(1),
  assessmentResultId: z.string().nullable().optional(),
  consentEventId: z.string().min(1),
  sharedFields: z.array(z.enum(["FIRST_NAME", "REFERRAL_REASON", "ASSESSMENT_SUMMARY", "CONTACT_DETAILS"])).min(1),
  purposeSummary: z.string().min(5).max(300),
});

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const { items, nextCursor, hasMore } = await listUserReferrals(user.id, { limit, cursor });
  return jsonPage(
    items.map((r) => ({
      id: r.id,
      provider: r.providerService.provider.displayName,
      serviceName: r.providerService.serviceName,
      careLevel: r.providerService.careLevel,
      state: r.state,
      version: r.version,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      simulated: r.providerService.provider.demoData,
      sharedFields: r.sharedFields.split("|").filter(Boolean),
      lastEvent: r.events.length ? { type: r.events[r.events.length - 1].eventType, at: r.events[r.events.length - 1].occurredAt, evidenceSource: r.events[r.events.length - 1].evidenceSource } : null,
    })),
    { nextCursor, hasMore, limit },
    requestId
  );
});

/**
 * POST /api/v1/referrals — requires Idempotency-Key (PRD §16.5/§14).
 * Consent + recipient eligibility re-verified inside the service (fail closed).
 */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  const idempotencyKey = requireIdempotencyKey(req);
  const parsed = CreateBody.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED", { details: { field: parsed.error.issues[0]?.path?.[0]?.toString() } });
  const { referral, duplicate } = await createReferral({
    actor: { userId: user.id, role: user.role },
    providerServiceId: parsed.data.providerServiceId,
    assessmentResultId: parsed.data.assessmentResultId ?? null,
    consentEventId: parsed.data.consentEventId,
    sharedFields: parsed.data.sharedFields,
    purposeSummary: parsed.data.purposeSummary,
    idempotencyKey,
  });
  return jsonOk({ referral, duplicate }, requestId, duplicate ? 200 : 201);
});

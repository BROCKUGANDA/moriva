import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { grantConsent, revokeConsent, listConsents, type PurposeCode } from "@/domains/consent/service";
import { audit } from "@/domains/audit/service";
import { MorivaError } from "@/lib/errors";

const ALLOWED: PurposeCode[] = [
  "ACCOUNT_SECURITY", "ASSESSMENT_STORAGE", "JOURNAL_STORAGE", "AI_PROCESSING",
  "REFERRAL", "HEALTH_CONTEXT_SHARE", "FOLLOWUP_NOTIFICATIONS", "RESEARCH", "MARKETING",
];

const DATA_CATEGORIES = ["CONTACT_DETAILS", "REFERRAL_REASON", "ASSESSMENT_SUMMARY", "HEALTH_CONTEXT", "JOURNAL", "NOTIFICATIONS"] as const;

const GrantBody = z.object({
  purpose: z.enum(ALLOWED as [PurposeCode, ...PurposeCode[]]),
  dataCategories: z.array(z.enum(DATA_CATEGORIES as unknown as [string, ...string[]])).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  recipientType: z.enum(["PLATFORM", "PROVIDER", "RESEARCH", "NONE"]).optional(),
  recipientId: z.string().nullable().optional(),
});

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit } = parsePagination(req.nextUrl.searchParams);
  const consents = await listConsents(user.id, limit);
  return jsonPage(consents, { nextCursor: null, hasMore: false, limit }, requestId);
});

export const POST = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  requireIdempotencyKey(req);
  const parsed = GrantBody.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const recipientType = parsed.data.recipientType ?? "PLATFORM";
  if (recipientType === "PROVIDER" && !parsed.data.recipientId) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "recipientId" }, messageOverride: "Sharing with a provider must name the provider." });
  }
  if (parsed.data.expiresAt) {
    const exp = new Date(parsed.data.expiresAt);
    if (!Number.isFinite(exp.getTime()) || exp.getTime() <= Date.now()) {
      throw new MorivaError("VALIDATION_FAILED", { details: { field: "expiresAt" }, messageOverride: "Expiry must be a future date." });
    }
  }
  const event = await grantConsent({
    subjectId: user.id,
    actorId: user.id,
    purpose: parsed.data.purpose,
    recipientType,
    recipientId: parsed.data.recipientId ?? null,
    dataCategories: parsed.data.dataCategories,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "CONSENT_GRANTED", resourceType: "consent_event", resourceId: event.id, purpose: parsed.data.purpose, outcome: "ALLOW" });
  return jsonOk({ consent: { id: event.id, purpose: parsed.data.purpose, status: event.status } }, requestId, 201);
});

const RevokeBody = z.object({ purpose: z.enum(ALLOWED as [PurposeCode, ...PurposeCode[]]), recipientId: z.string().nullable().optional() });

export const DELETE = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  const parsed = RevokeBody.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const count = await revokeConsent({
    subjectId: user.id,
    actorId: user.id,
    purpose: parsed.data.purpose,
    recipientId: parsed.data.recipientId ?? null,
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "CONSENT_REVOKED", resourceType: "consent_event", purpose: parsed.data.purpose, outcome: count > 0 ? "ALLOW" : "DENY", metadata: { revoked: count } });
  if (count === 0) throw new MorivaError("RESOURCE_NOT_FOUND", { messageOverride: "No active consent found for that purpose." });
  return jsonOk({ revoked: count }, requestId);
});

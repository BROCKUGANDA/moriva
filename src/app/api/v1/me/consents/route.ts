import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { grantConsent, revokeConsent, listConsents, type PurposeCode } from "@/domains/consent/service";
import { audit } from "@/domains/audit/service";
import { MorivaError } from "@/lib/errors";

const ALLOWED: PurposeCode[] = [
  "ACCOUNT_SECURITY", "ASSESSMENT_STORAGE", "JOURNAL_STORAGE", "AI_PROCESSING",
  "REFERRAL", "HEALTH_CONTEXT_SHARE", "FOLLOWUP_NOTIFICATIONS", "RESEARCH", "MARKETING",
];

const GrantBody = z.object({
  purpose: z.enum(ALLOWED as [PurposeCode, ...PurposeCode[]]),
  dataCategories: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  return jsonOk({ consents: await listConsents(user.id) }, "");
});

export const POST = withApi({ rate: "write", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = GrantBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const event = await grantConsent({
    subjectId: user.id,
    actorId: user.id,
    purpose: parsed.data.purpose,
    recipientType: "PLATFORM",
    dataCategories: parsed.data.dataCategories,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "CONSENT_GRANTED", resourceType: "consent_event", resourceId: event.id, purpose: parsed.data.purpose, outcome: "ALLOW" });
  return jsonOk({ consent: { id: event.id, purpose: parsed.data.purpose, status: event.status } }, "", 201);
});

const RevokeBody = z.object({ purpose: z.enum(ALLOWED as [PurposeCode, ...PurposeCode[]]), recipientId: z.string().nullable().optional() });

export const DELETE = withApi({ rate: "write", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = RevokeBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const count = await revokeConsent({
    subjectId: user.id,
    actorId: user.id,
    purpose: parsed.data.purpose,
    recipientId: parsed.data.recipientId ?? null,
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "CONSENT_REVOKED", resourceType: "consent_event", purpose: parsed.data.purpose, outcome: count > 0 ? "ALLOW" : "DENY", metadata: { revoked: count } });
  if (count === 0) throw new MorivaError("RESOURCE_NOT_FOUND", { messageOverride: "No active consent found for that purpose." });
  return jsonOk({ revoked: count }, "");
});

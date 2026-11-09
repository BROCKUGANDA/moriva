import { withApi, jsonOk, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { saveResponse } from "@/domains/assessment/service";
import { MorivaError } from "@/lib/errors";
import { recordSafetyEvent } from "@/domains/safety/service";
import { audit } from "@/domains/audit/service";

const Body = z.object({ value: z.number().int().min(0).max(3).nullable() });

/**
 * PUT — idempotent upsert of one answer (unique (session,item)).
 * An urgent-risk answer returns URGENT_SUPPORT_TRIGGERED immediately (PRD §7.3).
 */
export const PUT = withApi({ rate: "assessment", csrf: true })(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED", { details: { field: "value" } });
  const outcome = await saveResponse(user.id, params.id, params.itemId, parsed.data.value);
  if (outcome.urgent) {
    await recordSafetyEvent({
      subjectUserId: user.id,
      sourceType: "ASSESSMENT_RISK_ITEM",
      triggerCode: params.itemId,
      regionCode: "AE-AZ",
      sessionId: params.id,
      itemId: params.itemId,
    });
    await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "SAFETY_TRIGGERED", resourceType: "safety_event", purpose: "urgent-risk", outcome: "ALLOW" });
    return jsonOk(
      {
        saved: true,
        urgentSupportTriggered: true,
        redirect: "/help-now?source=assessment&trigger=urgent",
      }, requestId,
      200
    );
  }
  return jsonOk({ saved: true, urgentSupportTriggered: false }, requestId);
});

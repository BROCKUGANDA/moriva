import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { reflect } from "@/domains/ai/service";
import { toApiProblem } from "@/lib/errors";
import { randomToken } from "@/lib/security";

const Body = z.object({
  message: z.string().min(1).max(2000),
  consentAcknowledged: z.boolean().optional(),
});

/**
 * POST — guarded AI pipeline. Fail-closed (ADR-0005): always AI_DISABLED, zero external calls.
 * The MorivaError is mapped here so the response stays a clean ApiProblem.
 */
export const POST = withApi({ rate: "safety", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonOk({ code: "VALIDATION_FAILED" }, "", 422);
  try {
    await reflect({ userId: user.id, message: parsed.data.message, consentAcknowledged: parsed.data.consentAcknowledged ?? false });
    return jsonOk({ unreachable: true }, "");
  } catch (err) {
    const { status, body } = toApiProblem(err, randomToken(8));
    return jsonOk(body, body.requestId, status);
  }
});

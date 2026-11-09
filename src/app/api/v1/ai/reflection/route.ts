import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { reflect } from "@/domains/ai/service";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  message: z.string().min(1).max(2000),
  consentAcknowledged: z.boolean().optional(),
});

/**
 * POST — guarded AI pipeline. Fail-closed (ADR-0005): always AI_DISABLED, zero external calls.
 * The MorivaError is mapped here so the response stays a clean ApiProblem.
 */
export const POST = withApi({ rate: "safety", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  await reflect({ userId: user.id, message: parsed.data.message, consentAcknowledged: parsed.data.consentAcknowledged ?? false });
  return jsonOk({ unreachable: true }, requestId);
});

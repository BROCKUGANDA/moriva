import { withApi, jsonOk, requireIdempotencyKey } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { completeSession } from "@/domains/assessment/service";
import { MorivaError } from "@/lib/errors";

export const POST = withApi({ rate: "assessment", csrf: true })(async ({ req, params, requestId }) => {
  const user = await requireUser();
  requireIdempotencyKey(req);
  const outcome = await completeSession(user.id, params.id);
  if (!outcome.scored) {
    throw new MorivaError("ASSESSMENT_INCOMPLETE", {
      details: { missing: outcome.missing },
      messageOverride: "There is not enough information to calculate this assessment. You can complete the missing items or explore general support options.",
    });
  }
  return jsonOk({ session: { id: params.id }, result: outcome }, requestId);
});

import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { completeSession } from "@/domains/assessment/service";
import { MorivaError } from "@/lib/errors";

export const POST = withApi({ rate: "assessment", csrf: true })(async ({ params }) => {
  const user = await requireUser();
  const outcome = await completeSession(user.id, params.id);
  if (!outcome.scored) {
    throw new MorivaError("ASSESSMENT_INCOMPLETE", {
      details: { missing: outcome.missing.join(",") },
      messageOverride: "There isn't enough information to calculate this assessment. You can complete the missing items or explore general support options.",
    });
  }
  return jsonOk(outcome, "");
});

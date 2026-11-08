import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { navigate } from "@/domains/navigation/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

/**
 * GET /api/v1/support-options?resultId=…|resultCode=…|urgentRisk=true
 * Deterministic pathway output with rationale + rule version (FR-NV-002).
 */
export const GET = withApi({ rate: "read" })(async ({ req }) => {
  const user = await requireUser();
  const url = req.nextUrl;
  const resultId = url.searchParams.get("resultId");
  const urgentRisk = url.searchParams.get("urgentRisk") === "true";

  let resultCode: string | null = url.searchParams.get("resultCode");
  if (resultId) {
    const result = await db.assessmentResult.findUnique({
      where: { id: resultId },
      include: { session: true },
    });
    if (!result || result.session.userId !== user.id) throw new MorivaError("RESOURCE_NOT_FOUND");
    resultCode = result.interpretationCode;
  }
  try {
    const nav = await navigate({ resultCode, urgentRisk });
    return jsonOk(nav, "");
  } catch (e) {
    if (e instanceof MorivaError && e.code === "PATHWAY_UNAVAILABLE") throw e;
    throw e;
  }
});

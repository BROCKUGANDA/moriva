import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { navigate } from "@/domains/navigation/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

/**
 * GET /api/v1/support-options?resultId=…|resultCode=…|urgentRisk=true
 * Deterministic pathway output with rationale + rule version (FR-NV-002).
 */
export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const url = req.nextUrl;
  const resultId = url.searchParams.get("resultId");
  const urgentRisk = url.searchParams.get("urgentRisk") === "true";

  const codeParam = url.searchParams.get("resultCode");
  const ALLOWED_CODES = ["DEMO_LOW", "DEMO_MODERATE", "DEMO_ELEVATED", "INCOMPLETE"];
  if (codeParam && !ALLOWED_CODES.includes(codeParam)) throw new MorivaError("VALIDATION_FAILED", { details: { field: "resultCode" } });
  let resultCode: string | null = codeParam;
  if (resultId) {
    const result = await db.assessmentResult.findUnique({
      where: { id: resultId },
      include: { session: true },
    });
    if (!result || result.session.userId !== user.id) throw new MorivaError("RESOURCE_NOT_FOUND");
    resultCode = result.interpretationCode;
  }
  const nav = await navigate({ resultCode, urgentRisk });
  return jsonOk(nav, requestId);
});
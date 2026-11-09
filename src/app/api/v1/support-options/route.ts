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
  if (codeParam) {
    if (codeParam.length > 64) throw new MorivaError("VALIDATION_FAILED", { details: { field: "resultCode" } });
    // Validate against the codes actually defined by the approved instrument versions,
    // never a hardcoded list (instrument codes are versioned content).
    const versions = await db.instrumentVersion.findMany({
      where: { status: { in: ["APPROVED", "APPROVED_SIMULATION"] } },
      select: { interpretationEn: true },
    });
    const known = new Set<string>(["INCOMPLETE"]);
    for (const v of versions) {
      try {
        const bands = JSON.parse(v.interpretationEn || "[]") as Array<{ code?: unknown }>;
        for (const b of bands) if (typeof b?.code === "string") known.add(b.code);
      } catch {
        // Malformed band config is surfaced by the result route; navigation falls back honestly here.
      }
    }
    if (known.size > 1 && !known.has(codeParam)) {
      throw new MorivaError("VALIDATION_FAILED", { details: { field: "resultCode" } });
    }
  }
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
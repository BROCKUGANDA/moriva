import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { getOwnedSession } from "@/domains/assessment/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

/** Result explanation with limitations (non-diagnostic, versioned) — PRD §7.4. */
export const GET = withApi({ rate: "read" })(async ({ params, requestId }) => {
  const user = await requireUser();
  const session = await getOwnedSession(user.id, params.id);
  if (!session.result) throw new MorivaError("ASSESSMENT_INCOMPLETE", { messageOverride: "There isn't a result for this session yet." });
  let bands: Array<{ code: string; titleEn: string; bodyEn: string }>; 
  try {
    bands = JSON.parse(session.instrumentVersion.interpretationEn || "[]");
  } catch {
    throw new MorivaError("SCORING_CONFIG_INVALID");
  }
  const band = bands.find((b) => b.code === session.result!.interpretationCode) ?? null;
  // content blocks for limitations (from content_items, fallback inline)
  const blocks = await db.contentItem.findMany({ where: { contentType: "RESULT_BLOCK", status: "REVIEWED", locale: "en" }, take: 20, orderBy: { version: "desc" } });
  return jsonOk(
    {
      result: {
        id: session.result.id,
        rawScore: session.result.rawScore,
        transformedScore: session.result.transformedScore,
        interpretationCode: session.result.interpretationCode,
        band,
        computedAt: session.result.computedAt,
        ruleVersion: session.result.ruleVersion,
        limitationsContentVersion: session.result.limitationsContentVersion,
      },
      instrument: {
        name: session.instrumentVersion.instrument.displayName,
        version: session.instrumentVersion.version,
        locale: session.instrumentVersion.locale,
        timeframe: session.instrumentVersion.timeframe,
        simulationOnly: session.instrumentVersion.instrument.status === "SIMULATION_ONLY",
        licenceStatus: session.instrumentVersion.licenceStatus,
        validityNotes: session.instrumentVersion.validityNotes,
        clinicalApprover: session.instrumentVersion.clinicalApprover,
      },
      limitations: session.instrumentVersion.limitationsEn,
      contentBlocks: blocks.map((b) => ({ title: b.title, body: b.body, sourceRef: b.sourceRef })),
      completedAt: session.completedAt,
    }, requestId
  );
});

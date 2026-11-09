import { db } from "@/lib/db";
import { withApi, jsonOk, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { getOwnedSession } from "@/domains/assessment/service";
import { MorivaError } from "@/lib/errors";
import { SYNTHETIC_TRIGGER_THRESHOLD } from "@/domains/assessment/scoring";

/** Session state for the questionnaire runner (ownership-scoped). */
export const GET = withApi({ rate: "assessment" })(async ({ params, requestId }) => {
  const user = await requireUser();
  const session = await getOwnedSession(user.id, params.id);
  const items = await db.instrumentItem.findMany({
    where: { instrumentVersionId: session.instrumentVersionId },
    orderBy: { ordinal: "asc" },
  });
  return jsonOk(
    {
      session: {
        id: session.id,
        status: session.status,
        locale: session.locale,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
      instrument: {
        code: session.instrumentVersion.instrument.code,
        displayName: session.instrumentVersion.instrument.displayName,
        simulationOnly: session.instrumentVersion.instrument.status === "SIMULATION_ONLY",
        version: session.instrumentVersion.version,
        timeframe: session.instrumentVersion.timeframe,
        validityNotes: session.instrumentVersion.validityNotes,
        riskItemKey: session.instrumentVersion.riskItemKey,
        triggerThreshold: SYNTHETIC_TRIGGER_THRESHOLD,
      },
      items: items.map((i) => {
        let schema = null;
        try {
          schema = JSON.parse(i.responseSchema);
        } catch {
          throw new MorivaError("SCORING_CONFIG_INVALID");
        }
        return {
          itemKey: i.itemKey,
          ordinal: i.ordinal,
          promptEn: i.promptEn,
          helperEn: i.helperEn,
          required: i.required,
          schema,
        };
      }),
      responses: session.responses.map((r) => ({ itemKey: r.itemId, value: r.responseValue, answeredAt: r.answeredAt })),
    }, requestId
  );
});

const AbandonBody = z.object({ action: z.literal("abandon") });

export const PATCH = withApi({ rate: "assessment", csrf: true })(async ({ req, params, requestId }) => {
  const user = await requireUser();
  const session = await getOwnedSession(user.id, params.id);
  const parsed = AbandonBody.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  await db.assessmentSession.updateMany({ where: { id: session.id, status: { in: ["CREATED", "IN_PROGRESS"] } }, data: { status: "ABANDONED" } });
  return jsonOk({ status: "ABANDONED" }, requestId);
});

import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { getOwnedSession } from "@/domains/assessment/service";
import { MorivaError } from "@/lib/errors";
import { SYNTHETIC_TRIGGER_THRESHOLD } from "@/domains/assessment/scoring";

/** Session state for the questionnaire runner (ownership-scoped). */
export const GET = withApi({ rate: "assessment" })(async ({ params }) => {
  const user = await requireUser();
  const session = await getOwnedSession(user.id, params.id);
  const items = await (async () => {
    const { db } = await import("@/lib/db");
    return db.instrumentItem.findMany({
      where: { instrumentVersionId: session.instrumentVersionId },
      orderBy: { ordinal: "asc" },
    });
  })();
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
      items: items.map((i) => ({
        itemKey: i.itemKey,
        ordinal: i.ordinal,
        promptEn: i.promptEn,
        helperEn: i.helperEn,
        required: i.required,
        schema: JSON.parse(i.responseSchema),
      })),
      responses: session.responses.map((r) => ({ itemKey: r.itemId, value: r.responseValue, answeredAt: r.answeredAt })),
    },
    ""
  );
});

const AbandonBody = z.object({ action: z.literal("abandon") });

export const PATCH = withApi({ rate: "assessment", csrf: true })(async ({ req, params }) => {
  const user = await requireUser();
  const session = await getOwnedSession(user.id, params.id);
  const parsed = AbandonBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const { db } = await import("@/lib/db");
  await db.assessmentSession.update({ where: { id: session.id }, data: { status: "ABANDONED" } });
  return jsonOk({ status: "ABANDONED" }, "");
});

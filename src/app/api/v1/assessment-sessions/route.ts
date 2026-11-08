import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { createSession, listUserSessions } from "@/domains/assessment/service";

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  const sessions = await listUserSessions(user.id);
  return jsonOk(
    {
      sessions: sessions.map((s) => ({
        id: s.id,
        instrument: s.instrumentVersion.instrument.displayName,
        instrumentCode: s.instrumentVersion.instrument.code,
        instrumentVersion: s.instrumentVersion.version,
        simulationOnly: s.instrumentVersion.instrument.status === "SIMULATION_ONLY",
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        interpretationCode: s.result?.interpretationCode ?? null,
        locale: s.locale,
        scoringVersion: s.scoringVersion,
      })),
    },
    ""
  );
});

export const POST = withApi({ rate: "assessment", csrf: true })(async () => {
  const user = await requireUser();
  const session = await createSession(user.id);
  return jsonOk({ sessionId: session.id, status: session.status }, "", 201);
});

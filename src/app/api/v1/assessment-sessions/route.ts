import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { createSession, listUserSessions } from "@/domains/assessment/service";

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const { items, nextCursor, hasMore } = await listUserSessions(user.id, { limit, cursor });
  return jsonPage(
    items.map((s) => ({
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
    { nextCursor, hasMore, limit },
    requestId
  );
});

export const POST = withApi({ rate: "assessment", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  const key = requireIdempotencyKey(req);
  const session = await createSession(user.id, "en", key);
  return jsonOk({ sessionId: session.id, status: session.status }, requestId, 201);
});

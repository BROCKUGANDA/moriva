import { withApi, jsonPage, parsePagination } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { listAuditForUser } from "@/domains/audit/service";

/** The user's own access history (PRD §7.9) — no other users' events are reachable. */
export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit } = parsePagination(req.nextUrl.searchParams);
  const events = await listAuditForUser(user.id, limit);
  return jsonPage(events, { nextCursor: null, hasMore: false, limit }, requestId);
});

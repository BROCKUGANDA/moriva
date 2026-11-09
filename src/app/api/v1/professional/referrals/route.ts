import { withApi, jsonPage, parsePagination } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { PROFESSIONAL_ROLES, listAssignedReferrals } from "@/domains/professional/service";

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireRole(...PROFESSIONAL_ROLES);
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const { items, nextCursor, hasMore } = await listAssignedReferrals(user.id, { limit, cursor });
  return jsonPage(items, { nextCursor, hasMore, limit }, requestId, { simulatedWorkspace: true });
});

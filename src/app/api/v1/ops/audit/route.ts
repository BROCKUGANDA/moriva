import { withApi, jsonPage, parsePagination } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { listAuditRestricted } from "@/domains/audit/service";

/** Security-scoped audit view (read-only; no mutation endpoints exist for audit rows). */
export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  await requireRole("OPS_ADMIN_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED");
  const { limit } = parsePagination(req.nextUrl.searchParams);
  const events = await listAuditRestricted(limit);
  return jsonPage(events, { nextCursor: null, hasMore: false, limit }, requestId);
});

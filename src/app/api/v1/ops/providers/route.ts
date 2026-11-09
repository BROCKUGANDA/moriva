import { withApi, jsonPage, parsePagination } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { db } from "@/lib/db";

/** GET — all provider listings incl. non-referrable, with verification freshness. */
export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  await requireRole("OPS_ADMIN_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED");
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.provider.findMany({
    where: cursor ? { displayName: { gt: cursor } } : {},
    include: { services: true, organisation: true },
    orderBy: { displayName: "asc" },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return jsonPage(
    page.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      legalName: p.legalName,
      verificationStatus: p.verificationStatus,
      verificationScope: p.verificationScope,
      verifiedAt: p.verifiedAt,
      recheckDueAt: p.recheckDueAt,
      demoData: p.demoData,
      org: p.organisation?.name ?? null,
      services: p.services.map((s) => ({ id: s.id, serviceName: s.serviceName, status: s.status, careLevel: s.careLevel })),
    })),
    { nextCursor: hasMore ? page[page.length - 1].displayName : null, hasMore, limit },
    requestId
  );
});

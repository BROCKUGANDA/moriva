import { withApi, jsonPage, parsePagination } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";

/** Active support resources for the navigator (separate from provider services). */
export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  await requireUser();
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const resources = await db.supportResource.findMany({
    where: { status: "ACTIVE", ...(cursor ? { titleEn: { gt: cursor } } : {}) },
    orderBy: [{ resourceType: "asc" }, { titleEn: "asc" }],
    take: limit + 1,
    select: { id: true, titleEn: true, resourceType: true, sourceOrg: true, eligibility: true, sourceUrl: true, verifiedAt: true },
  });
  const hasMore = resources.length > limit;
  const page = hasMore ? resources.slice(0, limit) : resources;
  return jsonPage(
    page.length > 0
      ? page
      : [{ id: "fallback-help-now", titleEn: "Urgent help is always available", resourceType: "INFORMATION", sourceOrg: "MORIVA", eligibility: "", sourceUrl: "/help-now", verifiedAt: null }],
    { nextCursor: hasMore ? page[page.length - 1].titleEn : null, hasMore, limit },
    requestId
  );
});

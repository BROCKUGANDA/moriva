import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";

/** Active support resources for the navigator (separate from provider services). */
export const GET = withApi({ rate: "read" })(async () => {
  await requireUser();
  const resources = await db.supportResource.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ resourceType: "asc" }, { titleEn: "asc" }],
    select: { id: true, titleEn: true, resourceType: true, sourceOrg: true, eligibility: true, sourceUrl: true, verifiedAt: true },
  });
  return jsonOk({ resources }, "");
});

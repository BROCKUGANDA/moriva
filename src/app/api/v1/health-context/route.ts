import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

/** Health-context CRUD — user-owned, self-reported (PRD §12.1-12.2). */
const Body = z.object({
  itemType: z.enum(["CONDITION", "MEDICATION", "CONCERN", "FUNCTION", "CARE_FOLLOWUP"]),
  valueText: z.string().min(1).max(500),
});

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.healthContextItem.findMany({
    where: { userId: user.id, ...(cursor ? { recordedAt: { lt: new Date(cursor) } } : {}) },
    orderBy: { recordedAt: "desc" },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return jsonPage(
    page.map((i) => ({ id: i.id, itemType: i.itemType, valueText: i.valueText, sourceType: i.sourceType, recordedAt: i.recordedAt })),
    { nextCursor: hasMore ? page[page.length - 1].recordedAt.toISOString() : null, hasMore, limit },
    requestId
  );
});

export const POST = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  requireIdempotencyKey(req);
  const parsed = Body.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const item = await db.healthContextItem.create({
    data: {
      userId: user.id,
      itemType: parsed.data.itemType,
      valueText: parsed.data.valueText,
      sourceType: "SELF_REPORTED",
      sensitivityClass: "HEALTH",
    },
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "HEALTH_CONTEXT_ADDED", resourceType: "health_context_item", resourceId: item.id, outcome: "ALLOW" });
  return jsonOk({ item: { id: item.id } }, requestId, 201);
});

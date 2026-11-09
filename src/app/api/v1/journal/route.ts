import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";
import { checkConsent, requireConsent } from "@/domains/consent/service";

/** Journal CRUD — requires JOURNAL_STORAGE consent (server-enforced, FR-CN-003). */
const Body = z.object({ bodyText: z.string().min(1).max(5000) });

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const decision = await checkConsent({ subjectId: user.id, purpose: "JOURNAL_STORAGE" });
  if (!decision.granted) return jsonOk({ entries: [], page: { nextCursor: null, hasMore: false, limit: 0 }, consentRequired: true }, requestId);
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.journalEntry.findMany({
    where: { userId: user.id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return jsonPage(
    page.map((e) => ({ id: e.id, bodyText: e.bodyText, createdAt: e.createdAt, updatedAt: e.updatedAt })),
    { nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null, hasMore, limit },
    requestId
  );
});

export const POST = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  requireIdempotencyKey(req);
  const parsed = Body.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  await requireConsent({ subjectId: user.id, purpose: "JOURNAL_STORAGE" });
  const entry = await db.journalEntry.create({ data: { userId: user.id, bodyText: parsed.data.bodyText } });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "JOURNAL_CREATED", resourceType: "journal_entry", resourceId: entry.id, purpose: "JOURNAL_STORAGE", outcome: "ALLOW" });
  return jsonOk({ entry: { id: entry.id, createdAt: entry.createdAt } }, requestId, 201);
});

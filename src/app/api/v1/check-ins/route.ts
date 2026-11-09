import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";

/**
 * POST /api/v1/check-ins — a lightweight, optional, non-validated mood tag (Journey A.2).
 * Explicitly NOT an instrument result; stored as an in-app notification-free note.
 * It is never scored, shared or analysed automatically.
 */
const Body = z.object({ mood: z.number().int().min(1).max(4) });

export const POST = withApi({ rate: "assessment", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  requireIdempotencyKey(req);
  const parsed = Body.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const labels: Record<number, string> = { 1: "Rough", 2: "Low", 3: "Okay", 4: "Good" };
  await db.notification.create({
    data: {
      userId: user.id,
      purpose: "CHECK_IN",
      templateVersion: "checkin-v1",
      channel: "IN_APP",
      status: "SENT",
      nonSensitivePayload: JSON.stringify({ tag: labels[parsed.data.mood], kind: "MOOD_TAG_NON_VALIDATED" }),
      sentAt: new Date(),
    },
  });
  return jsonOk({ ok: true, tag: labels[parsed.data.mood], note: "This quick tag is not a validated score." }, requestId, 201);
});

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.notification.findMany({
    where: { userId: user.id, purpose: "CHECK_IN", ...(cursor ? { sentAt: { lt: new Date(cursor) } } : {}) },
    orderBy: { sentAt: "desc" },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return jsonPage(
    page.map((r) => {
      try {
        return { id: r.id, at: r.sentAt, ...JSON.parse(r.nonSensitivePayload) };
      } catch {
        return { at: r.sentAt };
      }
    }),
    { nextCursor: hasMore && page.length > 0 && page[page.length - 1].sentAt ? page[page.length - 1].sentAt!.toISOString() : null, hasMore, limit },
    requestId
  );
});

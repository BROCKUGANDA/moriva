import { withApi, jsonOk, jsonPage, parsePagination, requireIdempotencyKey, readJsonSafe } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

const Body = z.object({ requestType: z.enum(["EXPORT", "DELETION", "CORRECTION"]) });

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  const user = await requireUser();
  const { limit, cursor } = parsePagination(req.nextUrl.searchParams);
  const rows = await db.dataRequest.findMany({
    where: { userId: user.id, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return jsonPage(
    page.map((r) => ({
      id: r.id, requestType: r.requestType, status: r.status, createdAt: r.createdAt, note: r.note,
    })),
    { nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null, hasMore, limit },
    requestId
  );
});

/**
 * POST — export/deletion requests (FR-CN-006, Journey F).
 * Dedup via Idempotency-Key: same key returns the original request.
 * Export returns a downloadable JSON payload; deletion never promises erasure of legally-retained records.
 */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, requestId }) => {
  const user = await requireUser();
  const idempotencyKey = requireIdempotencyKey(req);
  const parsed = Body.safeParse(await readJsonSafe(req));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");

  const existing = await db.dataRequest.findFirst({ where: { userId: user.id, note: { contains: idempotencyKey } } });
  if (existing) {
    return jsonOk({ request: { id: existing.id, status: existing.status }, duplicate: true }, requestId, 200);
  }

  if (parsed.data.requestType === "EXPORT") {
    const snapshot = {
      consents: await db.consentEvent.findMany({ where: { subjectUserId: user.id }, take: 100 }),
      journals: await db.journalEntry.count({ where: { userId: user.id } }),
      healthContext: await db.healthContextItem.count({ where: { userId: user.id } }),
      sessions: await db.assessmentSession.count({ where: { userId: user.id } }),
      referrals: await db.referral.count({ where: { userId: user.id } }),
    };
    const request = await db.dataRequest.create({
      data: {
        userId: user.id,
        requestType: "EXPORT",
        status: "COMPLETED",
        completedAt: new Date(),
        note: `Export generated from current records (prototype: JSON summary). Key ${idempotencyKey}.`,
      },
    });
    await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "DATA_EXPORT_REQUESTED", resourceType: "data_request", resourceId: request.id, outcome: "ALLOW" });
    return jsonOk(
      {
        request: { id: request.id, status: request.status },
        download: { filename: `moriva-export-${request.id}.json`, payload: snapshot },
      },
      requestId,
      201
    );
  }

  const request = await db.dataRequest.create({
    data: {
      userId: user.id,
      requestType: parsed.data.requestType,
      status: "IN_PROGRESS",
      note: parsed.data.requestType === "DELETION"
        ? `Queued (key ${idempotencyKey}). Journal entries, health-context fields and your account will be deleted. Security audit events and consent proofs are retained under legal obligations, then anonymised where the law allows.`
        : `Queued for review — a human confirms scope before any correction. Key ${idempotencyKey}.`,
    },
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: parsed.data.requestType === "DELETION" ? "DATA_DELETION_REQUESTED" : "DATA_CORRECTION_REQUESTED", resourceType: "data_request", resourceId: request.id, outcome: "ALLOW" });
  return jsonOk({ request: { id: request.id, status: request.status } }, requestId, 201);
});

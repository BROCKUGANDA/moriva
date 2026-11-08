import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

const Body = z.object({ requestType: z.enum(["EXPORT", "DELETION", "CORRECTION"]) });

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  const rows = await db.dataRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return jsonOk(
    {
      requests: rows.map((r) => ({
        id: r.id, requestType: r.requestType, status: r.status, createdAt: r.createdAt, note: r.note,
      })),
    },
    ""
  );
});

/**
 * POST — export/deletion requests (FR-CN-006, Journey F).
 * Deletion never promises erasure of legally-retained records; the status note says exactly that.
 */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");

  if (parsed.data.requestType === "EXPORT") {
    const request = await db.dataRequest.create({
      data: {
        userId: user.id,
        requestType: "EXPORT",
        status: "COMPLETED",
        completedAt: new Date(),
        note: "Export generated from current records (prototype: JSON summary).",
      },
    });
    await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "DATA_EXPORT_REQUESTED", resourceType: "data_request", resourceId: request.id, outcome: "ALLOW" });
    return jsonOk({ request: { id: request.id, status: request.status } }, "", 201);
  }

  const request = await db.dataRequest.create({
    data: {
      userId: user.id,
      requestType: parsed.data.requestType,
      status: "IN_PROGRESS",
      note: parsed.data.requestType === "DELETION"
        ? "Queued. Journal entries, health-context fields and your account will be deleted. Security audit events and consent proofs are retained under legal obligations, then anonymised where the law allows."
        : "Queued for review — a human confirms scope before any correction.",
    },
  });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: parsed.data.requestType === "DELETION" ? "DATA_DELETION_REQUESTED" : "DATA_CORRECTION_REQUESTED", resourceType: "data_request", resourceId: request.id, outcome: "ALLOW" });
  return jsonOk({ request: { id: request.id, status: request.status } }, "", 201);
});

import { withApi, jsonOk, requireIdempotencyKey } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

export const DELETE = withApi({ rate: "write", csrf: true })(async ({ params, requestId }) => {
  const user = await requireUser();
  const entry = await db.journalEntry.findUnique({ where: { id: params.entryId } });
  if (!entry || entry.userId !== user.id) throw new MorivaError("RESOURCE_NOT_FOUND");
  await db.journalEntry.delete({ where: { id: entry.id } });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "JOURNAL_DELETED", resourceType: "journal_entry", resourceId: entry.id, purpose: "JOURNAL_STORAGE", outcome: "ALLOW" });
  return jsonOk({ deleted: true }, requestId);
});

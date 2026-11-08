import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

export const DELETE = withApi({ rate: "write", csrf: true })(async ({ params }) => {
  const user = await requireUser();
  const item = await db.healthContextItem.findUnique({ where: { id: params.itemId } });
  if (!item || item.userId !== user.id) throw new MorivaError("RESOURCE_NOT_FOUND");
  await db.healthContextItem.delete({ where: { id: item.id } });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "HEALTH_CONTEXT_REMOVED", resourceType: "health_context_item", resourceId: item.id, outcome: "ALLOW" });
  return jsonOk({ deleted: true }, "");
});

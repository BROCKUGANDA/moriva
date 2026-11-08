import { withApi, jsonOk } from "@/lib/api";
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

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  const items = await db.healthContextItem.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "desc" } });
  return jsonOk(
    { items: items.map((i) => ({ id: i.id, itemType: i.itemType, valueText: i.valueText, sourceType: i.sourceType, recordedAt: i.recordedAt })) },
    ""
  );
});

export const POST = withApi({ rate: "write", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
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
  return jsonOk({ item: { id: item.id } }, "", 201);
});

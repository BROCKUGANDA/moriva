import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

/** Journal CRUD — requires JOURNAL_STORAGE consent (server-enforced, FR-CN-003). */
const Body = z.object({ bodyText: z.string().min(1).max(5000) });

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  const decision = await (await import("@/domains/consent/service")).checkConsent({ subjectId: user.id, purpose: "JOURNAL_STORAGE" });
  if (!decision.granted) return jsonOk({ entries: [], consentRequired: true }, "");
  const entries = await db.journalEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return jsonOk(
    { entries: entries.map((e) => ({ id: e.id, bodyText: e.bodyText, createdAt: e.createdAt, updatedAt: e.updatedAt })) },
    ""
  );
});

export const POST = withApi({ rate: "write", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  // server-side consent gate: journal storage is optional and revocable
  await (await import("@/domains/consent/service")).requireConsent({ subjectId: user.id, purpose: "JOURNAL_STORAGE" });
  const entry = await db.journalEntry.create({ data: { userId: user.id, bodyText: parsed.data.bodyText } });
  await audit({ actorId: user.id, actorRole: user.role, subjectId: user.id, action: "JOURNAL_CREATED", resourceType: "journal_entry", resourceId: entry.id, purpose: "JOURNAL_STORAGE", outcome: "ALLOW" });
  return jsonOk({ entry: { id: entry.id, createdAt: entry.createdAt } }, "", 201);
});

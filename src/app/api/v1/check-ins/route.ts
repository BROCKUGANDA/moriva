import { withApi, jsonOk } from "@/lib/api";
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

export const POST = withApi({ rate: "assessment", csrf: true })(async ({ req }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
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
  return jsonOk({ ok: true, tag: labels[parsed.data.mood], note: "This quick tag is not a validated score." }, "", 201);
});

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  const rows = await db.notification.findMany({
    where: { userId: user.id, purpose: "CHECK_IN" },
    orderBy: { sentAt: "desc" },
    take: 30,
  });
  return jsonOk(
    {
      checkIns: rows.map((r) => {
        try {
          return { at: r.sentAt, ...JSON.parse(r.nonSensitivePayload) };
        } catch {
          return { at: r.sentAt };
        }
      }),
    },
    ""
  );
});

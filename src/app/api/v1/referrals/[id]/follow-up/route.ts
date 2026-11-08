import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { getOwnedReferral, transitionReferral } from "@/domains/referrals/service";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  action: z.enum(["PATIENT_CONTACT_CONFIRMED", "FOLLOW_UP_COMPLETED"]),
  note: z.string().max(500).optional(),
});

/**
 * POST — user-reported follow-up events (PRD Journey B.6 / §14.2).
 * Stored as PATIENT_REPORTED evidence, distinct from provider confirmation.
 */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, params }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const r = await getOwnedReferral(user.id, params.id);
  const to = parsed.data.action === "PATIENT_CONTACT_CONFIRMED" ? "CONTACT_CONFIRMED" : "FOLLOW_UP_COMPLETED";
  const outcome = await transitionReferral({
    referralId: r.id,
    to,
    actor: { userId: user.id, role: user.role },
    expectedVersion: r.version,
    noteClass: "PATIENT_MESSAGE",
    noteBody: parsed.data.note,
  });
  // schedule follow-up window after confirmed contact
  if (to === "CONTACT_CONFIRMED") {
    const due = new Date(Date.now() + 7 * 24 * 3600_000);
    await (await import("@/lib/db")).db.followUp.create({
      data: { referralId: r.id, dueAt: due, status: "DUE", evidenceSource: "PATIENT_REPORTED" },
    }).catch(() => null);
  }
  return jsonOk({ state: outcome.to, version: outcome.referral.version }, "");
});

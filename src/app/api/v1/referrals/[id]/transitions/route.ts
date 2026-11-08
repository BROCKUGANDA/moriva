import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { transitionReferral, REFERRAL_STATES } from "@/domains/referrals/service";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  to: z.enum(REFERRAL_STATES as unknown as [string, ...string[]]),
  expectedVersion: z.number().int().positive(),
  evidenceSource: z.enum(["PROVIDER_CONFIRMED", "PATIENT_REPORTED", "SIMULATED", "INTEGRATION_CONFIRMED"]).optional(),
  noteClass: z.enum(["CLINICAL_NOTE", "OPERATIONS_NOTE", "PATIENT_MESSAGE"]).optional(),
  noteBody: z.string().max(2000).optional(),
  safeReasonCode: z.string().max(60).optional(),
});

/** Versioned transition endpoint (PRD §16.6). Rejects stale updates with REFERRAL_STATE_CONFLICT. */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, params }) => {
  const user = await requireUser();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED", { details: { field: parsed.error.issues[0]?.path?.[0]?.toString() } });
  const outcome = await transitionReferral({
    referralId: params.id,
    to: parsed.data.to as never,
    actor: { userId: user.id, role: user.role },
    expectedVersion: parsed.data.expectedVersion,
    evidenceSource: parsed.data.evidenceSource as never,
    noteClass: parsed.data.noteClass,
    noteBody: parsed.data.noteBody,
    safeReasonCode: parsed.data.safeReasonCode,
  });
  return jsonOk({ state: outcome.to, version: outcome.referral.version }, "");
});

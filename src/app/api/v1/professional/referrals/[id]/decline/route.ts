import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireRole } from "@/domains/identity/service";
import { PROFESSIONAL_ROLES, professionalAction } from "@/domains/professional/service";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  note: z.string().max(2000).optional(),
  safeReasonCode: z.string().max(60).optional(),
});

/** DECLINE — simulated professional action; evidence source is forced to SIMULATED in demo mode. */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, params }) => {
  const user = await requireRole(...PROFESSIONAL_ROLES);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const outcome = await professionalAction({
    professionalId: user.id,
    role: user.role,
    referralId: params.id,
    action: "DECLINE",
    noteClass: "OPERATIONS_NOTE",
    noteBody: parsed.data.note,
    safeReasonCode: parsed.data.safeReasonCode,
  });
  return jsonOk({ state: outcome.to, version: outcome.referral.version, simulated: true }, "");
});

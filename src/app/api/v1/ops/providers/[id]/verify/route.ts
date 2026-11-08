import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { requireRole } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { MorivaError } from "@/lib/errors";
import { audit } from "@/domains/audit/service";

const Body = z.object({
  action: z.enum(["MARK_VERIFIED", "MARK_EXPIRED", "MARK_SUSPENDED", "MARK_REJECTED", "MARK_PENDING"]),
  scope: z.string().max(200).optional(),
  recheckDays: z.number().int().min(7).max(365).optional(),
});

/**
 * POST — provider verification workflow. In this prototype only the DEMO simulation state
 * is meaningful; real verification requires a named human verifier (blocked, documented).
 */
export const POST = withApi({ rate: "write", csrf: true })(async ({ req, params }) => {
  const user = await requireRole("OPS_ADMIN_SIMULATED");
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const provider = await db.provider.findUnique({ where: { id: params.id } });
  if (!provider) throw new MorivaError("RESOURCE_NOT_FOUND");
  const statusMap: Record<string, string> = {
    MARK_VERIFIED: provider.demoData ? "DEMO_VERIFIED_SIMULATED" : "VERIFIED",
    MARK_EXPIRED: "EXPIRED",
    MARK_SUSPENDED: "SUSPENDED",
    MARK_REJECTED: "REJECTED",
    MARK_PENDING: "PENDING",
  };
  const recheck = new Date(Date.now() + (parsed.data.recheckDays ?? 90) * 24 * 3600_000);
  const updated = await db.provider.update({
    where: { id: provider.id },
    data: {
      verificationStatus: statusMap[parsed.data.action],
      verificationScope: parsed.data.scope ?? provider.verificationScope,
      verifiedAt: parsed.data.action === "MARK_VERIFIED" ? new Date() : provider.verifiedAt,
      recheckDueAt: recheck,
    },
  });
  // cascading service status for non-referrable states
  if (["MARK_EXPIRED", "MARK_SUSPENDED", "MARK_REJECTED"].includes(parsed.data.action)) {
    await db.providerService.updateMany({ where: { providerId: provider.id }, data: { status: "EXPIRED" } });
  } else if (parsed.data.action === "MARK_VERIFIED") {
    await db.providerService.updateMany({ where: { providerId: provider.id }, data: { status: "ACTIVE" } });
  }
  await audit({ actorId: user.id, actorRole: user.role, action: "PROVIDER_VERIFICATION_CHANGED", resourceType: "provider", resourceId: provider.id, outcome: "ALLOW", metadata: { to: updated.verificationStatus } });
  return jsonOk({ provider: { id: updated.id, verificationStatus: updated.verificationStatus, recheckDueAt: updated.recheckDueAt } }, "");
});

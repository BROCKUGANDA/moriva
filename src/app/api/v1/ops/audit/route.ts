import { withApi, jsonOk } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { listAuditRestricted } from "@/domains/audit/service";

/** Security-scoped audit view (read-only; no mutation endpoints exist for audit rows). */
export const GET = withApi({ rate: "read" })(async () => {
  await requireRole("OPS_ADMIN_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED");
  const events = await listAuditRestricted(150);
  return jsonOk({ events }, "");
});

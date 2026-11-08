import { withApi, jsonOk } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { outcomesDashboard } from "@/domains/analytics/service";
import { getEnv } from "@/lib/env";

/** GET /api/v1/ops/outcomes — aggregate only, thresholded, source-labelled (FR-AN-001..004). */
export const GET = withApi({ rate: "read" })(async () => {
  await requireRole("OPS_ADMIN_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED");
  const env = getEnv();
  const data = await outcomesDashboard(env.smallCellThreshold);
  return jsonOk(data, "");
});

import { withApi, jsonOk } from "@/lib/api";
import { requireRole } from "@/domains/identity/service";
import { PROFESSIONAL_ROLES, listAssignedReferrals } from "@/domains/professional/service";

export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireRole(...PROFESSIONAL_ROLES);
  const rows = await listAssignedReferrals(user.id);
  return jsonOk({ referrals: rows, simulatedWorkspace: true }, "");
});

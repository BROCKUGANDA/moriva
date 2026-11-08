import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { listAuditForUser } from "@/domains/audit/service";

/** The user's own access history (PRD §7.9) — no other users' events are reachable. */
export const GET = withApi({ rate: "read" })(async () => {
  const user = await requireUser();
  const events = await listAuditForUser(user.id, 60);
  return jsonOk({ events }, "");
});

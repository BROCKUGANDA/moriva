import { withApi, jsonOk } from "@/lib/api";
import { revokeCurrentSession, requireUser } from "@/domains/identity/service";
import { audit } from "@/domains/audit/service";

export const POST = withApi({ rate: "auth", csrf: true })(async ({ requestId }) => {
  const user = await requireUser();
  await audit({ actorId: user.id, actorRole: user.role, action: "AUTH_LOGOUT", resourceType: "user", resourceId: user.id, outcome: "ALLOW" });
  await revokeCurrentSession(); // FR-ID-004: sign-out invalidates access server-side
  return jsonOk({ ok: true }, requestId);
});

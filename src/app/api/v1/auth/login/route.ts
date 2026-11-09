import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { authenticate, createSession, setSessionCookies } from "@/domains/identity/service";
import { audit } from "@/domains/audit/service";
import { hashIp } from "@/lib/security";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
  roleHint: z.enum(["INDIVIDUAL", "PROFESSIONAL", "OPS"]).optional(), // selects which demo surface; server verifies actual role
});

export const POST = withApi({ rate: "auth", csrf: false })(async ({ req, ip, requestId }) => {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw new MorivaError("VALIDATION_FAILED");
  const { email, password } = parsed.data;

  const user = await authenticate(email, password);
  if (!user) {
    await audit({ action: "AUTH_LOGIN", resourceType: "user", outcome: "DENY", ipHash: hashIp(ip), metadata: { reason: "INVALID_CREDENTIALS" } });
    throw new MorivaError("AUTH_REQUIRED", { messageOverride: "Email or password is incorrect." });
  }

  // role-hint guard: demo surface links must match the server-side role
  if (parsed.data.roleHint) {
    const roleMatches =
      parsed.data.roleHint === "INDIVIDUAL" ? user.role === "INDIVIDUAL"
      : parsed.data.roleHint === "PROFESSIONAL" ? ["PROFESSIONAL_SIMULATED", "PROVIDER_COORDINATOR_SIMULATED", "CLINICAL_GOVERNANCE_SIMULATED"].includes(user.role)
      : user.role === "OPS_ADMIN_SIMULATED";
    if (!roleMatches) {
      await audit({ actorId: user.id, action: "AUTH_LOGIN", resourceType: "user", resourceId: user.id, outcome: "DENY", ipHash: hashIp(ip), metadata: { reason: "ROLE_HINT_MISMATCH" } });
      throw new MorivaError("AUTH_FORBIDDEN", { messageOverride: "This account does not have access to that workspace." });
    }
  }

  const { token, csrfToken } = await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });
  await setSessionCookies(token, csrfToken);
  await audit({
    actorId: user.id, actorRole: user.role, subjectId: user.id,
    action: "AUTH_LOGIN", resourceType: "user", resourceId: user.id, outcome: "ALLOW", ipHash: hashIp(ip),
  });
  return jsonOk(
    { user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, demoData: user.demoData } }, requestId, 200
  );
});

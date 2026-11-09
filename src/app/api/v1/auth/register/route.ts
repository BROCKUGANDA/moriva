import { withApi, jsonOk } from "@/lib/api";
import { z } from "zod";
import { registerUser, createSession, setSessionCookies } from "@/domains/identity/service";
import { audit } from "@/domains/audit/service";
import { hashIp } from "@/lib/security";
import { MorivaError } from "@/lib/errors";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(200),
  displayName: z.string().min(2).max(80),
});

export const POST = withApi({ rate: "auth", csrf: false })(async ({ req, ip, requestId }) => {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: parsed.error.issues[0]?.path?.[0]?.toString() ?? "body" } });
  }
  const user = await registerUser(parsed.data);
  const { token, csrfToken } = await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });
  await setSessionCookies(token, csrfToken);
  await audit({
    actorId: user.id, actorRole: user.role, subjectId: user.id,
    action: "AUTH_REGISTER", resourceType: "user", resourceId: user.id, outcome: "ALLOW", ipHash: hashIp(ip),
  });
  return jsonOk({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, demoData: user.demoData } }, requestId, 201);
});

import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { listConsents } from "@/domains/consent/service";
import { getEnv } from "@/lib/env";

export const GET = withApi({ rate: "read" })(async ({ requestId }) => {
  const user = await requireUser();
  const consents = await listConsents(user.id);
  const env = getEnv();
  return jsonOk(
    {
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, demoData: user.demoData },
      consents,
      environment: { demoMode: env.demoMode, aiReflectionEnabled: env.aiReflectionEnabled },
    }, requestId
  );
});

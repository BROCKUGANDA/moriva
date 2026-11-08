import { withApi, jsonOk } from "@/lib/api";
import { requireUser } from "@/domains/identity/service";
import { searchProviders } from "@/domains/directory/service";

export const GET = withApi({ rate: "read" })(async ({ req }) => {
  await requireUser();
  const url = req.nextUrl;
  const providers = await searchProviders({
    q: url.searchParams.get("q") ?? undefined,
    careLevel: url.searchParams.get("careLevel") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
  });
  return jsonOk({ providers }, "");
});

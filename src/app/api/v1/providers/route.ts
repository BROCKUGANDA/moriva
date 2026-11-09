import { withApi, jsonPage, parsePagination } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/domains/identity/service";
import { searchProviders } from "@/domains/directory/service";
import { MorivaError } from "@/lib/errors";

const CARE_LEVELS = ["SELF_GUIDED", "COMMUNITY", "PRIMARY_CARE", "TELEMH", "SPECIALIST", "EMERGENCY"] as const;

export const GET = withApi({ rate: "read" })(async ({ req, requestId }) => {
  await requireUser();
  const url = req.nextUrl;
  const q = url.searchParams.get("q") ?? undefined;
  if (q && q.length > 120) throw new MorivaError("VALIDATION_FAILED", { details: { field: "q" } });
  const careLevel = url.searchParams.get("careLevel") ?? undefined;
  if (careLevel && !(CARE_LEVELS as readonly string[]).includes(careLevel)) {
    throw new MorivaError("VALIDATION_FAILED", { details: { field: "careLevel" } });
  }
  const language = url.searchParams.get("language") ?? undefined;
  if (language && language.length > 16) throw new MorivaError("VALIDATION_FAILED", { details: { field: "language" } });
  const { limit, cursor } = parsePagination(url.searchParams);
  const { items, nextCursor, hasMore } = await searchProviders({ q, careLevel, language, limit, cursor });
  return jsonPage(items, { nextCursor, hasMore, limit }, requestId);
});

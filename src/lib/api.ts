/**
 * Central API route wrapper — the single request pipeline for /api/v1 (PRD §16.5).
 * requestId → rate limit → CSRF (mutations) → handler → consistent ApiProblem errors.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomToken } from "@/lib/security";
import { rateLimit, pruneBuckets } from "@/lib/security";
import { toApiProblem, MorivaError } from "@/lib/errors";
import { log } from "@/lib/logging";
import { getEnv } from "@/lib/env";
import { CSRF_COOKIE } from "@/domains/identity/service";

export type ApiContext = {
  req: NextRequest;
  requestId: string;
  ip: string | null;
  params: Record<string, string>;
};

export type ApiHandler = (ctx: ApiContext) => Promise<NextResponse | Response>;

export function jsonOk(body: unknown, requestId: string, status = 200) {
  return NextResponse.json(body, { status, headers: { "x-request-id": requestId } });
}

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

/**
 * Rate-limit classes (per IP; auth routes additionally per-key).
 */
const RATE_CLASSES = {
  auth: { capacity: 20, refillPerMinute: 10 },
  read: { capacity: 240, refillPerMinute: 120 },
  write: { capacity: 60, refillPerMinute: 30 },
  assessment: { capacity: 120, refillPerMinute: 60 },
  safety: { capacity: 30, refillPerMinute: 15 },
} as const;

export type RateClass = keyof typeof RATE_CLASSES;

export function withApi(opts: { rate?: RateClass; csrf?: boolean } = {}) {
  const rateClass: RateClass = opts.rate ?? "read";
  return function wrap(handler: ApiHandler) {
    return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }): Promise<Response> => {
      const requestId = randomToken(12);
      const ip = clientIp(req);
      const started = Date.now();
      try {
        pruneBuckets();
        // 1. rate limit
        const limit = rateLimit(`api:${rateClass}:${ip ?? "unknown"}`, RATE_CLASSES[rateClass]);
        if (!limit.allowed) {
          return NextResponse.json(
            { code: "RATE_LIMITED", message: "Too many requests. Please try again in a moment.", requestId, retryable: true },
            { status: 429, headers: { "x-request-id": requestId, "Retry-After": String(limit.retryAfterSeconds) } }
          );
        }

        // 2. CSRF double-submit for cookie-authenticated mutations
        if (opts.csrf) {
          const cookieToken = req.cookies.get(CSRF_COOKIE)?.value ?? "";
          const headerToken = req.headers.get("x-csrf-token") ?? "";
          if (!cookieToken || !headerToken || cookieToken !== headerToken) {
            log.warn("CSRF_REJECTED", { requestId, path: req.nextUrl.pathname });
            throw new MorivaError("AUTH_FORBIDDEN", { messageOverride: "Security token missing or invalid. Refresh the page and try again." });
          }
        }

        // 3. params (Next 16: params is a Promise)
        const rawParams = await routeCtx?.params;
        const params = (rawParams && typeof rawParams === "object" ? await Promise.resolve(rawParams) : {}) as Record<string, string>;

        // 4. handler
        const res = await handler({ req, requestId, ip, params });
        res.headers.set("x-request-id", requestId);
        return res;
      } catch (err) {
        const { status, body } = toApiProblem(err, requestId);
        if (status >= 500) {
          log.error("API_ERROR", {
            requestId,
            path: req.nextUrl.pathname,
            method: req.method,
            // message only — never the raw error object (may contain internals)
            message: err instanceof Error ? err.message.slice(0, 200) : "unknown",
          });
        } else {
          log.info("API_REJECTED", { requestId, path: req.nextUrl.pathname, code: body.code, status });
        }
        return NextResponse.json(body, { status, headers: { "x-request-id": requestId } });
      } finally {
        const ms = Date.now() - started;
        if (ms > 1500) log.warn("API_SLOW", { path: req.nextUrl.pathname, ms });
      }
    };
  };
}

export function demoModeGuard() {
  const env = getEnv();
  if (!env.demoMode) throw new MorivaError("AUTH_FORBIDDEN", { messageOverride: "Demo identities are only available when demo mode is enabled." });
}

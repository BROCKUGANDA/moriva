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

export function jsonOk(body: Record<string, unknown>, requestId: string, status = 200) {
  const withId = body && typeof body === "object" && !Array.isArray(body) && !("requestId" in body)
    ? { ...body, requestId }
    : body;
  return NextResponse.json(withId, { status, headers: { "x-request-id": requestId } });
}

export type PageInfo = { nextCursor: string | null; hasMore: boolean; limit: number };

export function parsePagination(searchParams: URLSearchParams): { limit: number; cursor: string | null } {
  const rawLimit = Number(searchParams.get("limit") ?? searchParams.get("take") ?? "20");
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.floor(rawLimit))) : 20;
  const cursor = searchParams.get("cursor") ?? null;
  return { limit, cursor };
}

export function jsonPage(data: unknown[], page: PageInfo, requestId: string, extra: Record<string, unknown> = {}, status = 200) {
  return jsonOk({ data, page, ...extra }, requestId, status);
}

export function idempotencyKey(req: NextRequest): string | null {
  const key = req.headers.get("idempotency-key") ?? req.headers.get("x-idempotency-key") ?? null;
  if (!key) return null;
  return key.length >= 8 && key.length <= 128 ? key : null;
}

export function requireIdempotencyKey(req: NextRequest): string {
  const key = idempotencyKey(req);
  if (!key) {
    throw new MorivaError("VALIDATION_FAILED", {
      details: { field: "Idempotency-Key" },
      messageOverride: "This action needs an Idempotency-Key header (min 8 characters) so retries are safe.",
    });
  }
  return key;
}

const MAX_BODY_BYTES = 1_000_000;

async function readJsonSafe(req: NextRequest): Promise<unknown> {
  const len = req.headers.get("content-length");
  if (len && Number(len) > MAX_BODY_BYTES) {
    throw new MorivaError("PAYLOAD_TOO_LARGE");
  }
  const ct = req.headers.get("content-type") ?? "";
  if (req.method !== "GET" && req.method !== "HEAD" && ct && !ct.includes("application/json")) {
    throw new MorivaError("UNSUPPORTED_MEDIA_TYPE");
  }
  try {
    const text = await req.text();
    if (!text) return null;
    if (text.length > MAX_BODY_BYTES) throw new MorivaError("PAYLOAD_TOO_LARGE");
    return JSON.parse(text);
  } catch (e) {
    if (e instanceof MorivaError) throw e;
    throw new MorivaError("VALIDATION_FAILED", { messageOverride: "Request body must be valid JSON." });
  }
}

export { readJsonSafe };

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

function shaLite(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function isLoopback(ip: string | null): boolean {
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip === null;
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
        // 1. rate limit — loopback traffic is exempt in non-production demo mode so that
        //    local integration tests and the sandbox gateway (which proxies from localhost)
        //    are not throttled. Production limits every client regardless of source.
        const env = getEnv();
        const skipLimit = env.nodeEnv !== "production" && env.demoMode && isLoopback(ip);
        let remaining = -1;
        let retryAfter = 0;
        if (!skipLimit) {
          const ipKey = `api:${rateClass}:${ip ?? "unknown"}`;
          const ipLimit = rateLimit(ipKey, RATE_CLASSES[rateClass]);
          remaining = ipLimit.remaining;
          retryAfter = ipLimit.retryAfterSeconds;
          if (!ipLimit.allowed) {
            return NextResponse.json(
              { code: "RATE_LIMITED", message: "Too many requests. Please try again in a moment.", requestId, retryable: true },
              {
                status: 429,
                headers: {
                  "x-request-id": requestId,
                  "Retry-After": String(ipLimit.retryAfterSeconds),
                  "X-RateLimit-Limit": String(RATE_CLASSES[rateClass].capacity),
                  "X-RateLimit-Remaining": "0",
                },
              }
            );
          }
          if (rateClass === "auth") {
            const fp = req.headers.get("x-forwarded-for") ?? ip ?? "unknown";
            const keyLimit = rateLimit(`api:auth:key:${shaLite(fp)}`, { capacity: 60, refillPerMinute: 30 });
            if (!keyLimit.allowed) {
              return NextResponse.json(
                { code: "RATE_LIMITED", message: "Too many attempts. Please try again in a moment.", requestId, retryable: true },
                {
                  status: 429,
                  headers: {
                    "x-request-id": requestId,
                    "Retry-After": String(keyLimit.retryAfterSeconds),
                    "X-RateLimit-Limit": "60",
                    "X-RateLimit-Remaining": "0",
                  },
                }
              );
            }
            remaining = Math.min(remaining, keyLimit.remaining);
          }
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
        if (remaining >= 0) {
          res.headers.set("X-RateLimit-Limit", String(RATE_CLASSES[rateClass].capacity));
          res.headers.set("X-RateLimit-Remaining", String(remaining));
          if (retryAfter > 0) res.headers.set("Retry-After", String(retryAfter));
        }
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

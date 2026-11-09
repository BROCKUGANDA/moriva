/**
 * Edge guard (Next 16 `proxy.ts`): security headers for every response.
 * Auth itself stays in route handlers (`requireUser`/`requireRole`) — this layer
 * only guarantees baseline headers even for static/error responses.
 */
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

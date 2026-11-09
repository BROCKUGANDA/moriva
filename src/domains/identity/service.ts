/**
 * identity domain — password + session management (ADR-0003).
 * Standard primitives only: scrypt KDF, CSPRNG opaque tokens.
 * Only the SHA-256 hash of the session token is persisted.
 */
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sha256Hex, randomToken, hashPassword, verifyPassword } from "@/lib/security";
import { MorivaError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { log } from "@/lib/logging";

export const SESSION_COOKIE = "moriva_session";
export const CSRF_COOKIE = "moriva_csrf";
export const SESSION_TTL_HOURS = 8;

export function sessionTtlHours(): number {
  try {
    return getEnv().sessionTtlHours;
  } catch {
    return SESSION_TTL_HOURS;
  }
}

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  demoData: boolean;
  sessionId: string;
  csrfToken: string;
};

// ── accounts ──

export async function registerUser(input: { email: string; password: string; displayName: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new MorivaError("VALIDATION_FAILED", { details: { field: "email" }, messageOverride: "An account with this email already exists." });
  if (input.password.length < 10) throw new MorivaError("VALIDATION_FAILED", { details: { field: "password" }, messageOverride: "Password must be at least 10 characters." });
  const user = await db.user.create({
    data: {
      email,
      displayName: input.displayName.trim(),
      passwordHash: hashPassword(input.password),
      role: "INDIVIDUAL",
      profile: { create: {} },
    },
  });
  return user;
}

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || user.status !== "ACTIVE") return null;
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

// ── sessions ──

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null }) {
  const token = randomToken(32);
  const csrfToken = randomToken(24);
  const expiresAt = new Date(Date.now() + sessionTtlHours() * 3600_000);
  const session = await db.session.create({
    data: {
      userId,
      tokenHash: sha256Hex(token),
      csrfToken,
      expiresAt,
      ipHash: meta.ip ? sha256Hex("moriva-ip-pepper:" + meta.ip).slice(0, 24) : null,
      userAgent: meta.userAgent?.slice(0, 256) ?? null,
    },
  });
  return { session, token, csrfToken };
}

export function sessionCookieOptions() {
  const isProd = getEnv().nodeEnv === "production";
  const ttl = sessionTtlHours();
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    maxAge: ttl * 3600,
  };
}

export async function setSessionCookies(token: string, csrfToken: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  // CSRF double-submit cookie: readable by the app (not httpOnly) so the client can echo it in a header.
  jar.set(CSRF_COOKIE, csrfToken, { ...sessionCookieOptions(), httpOnly: false });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  jar.set(CSRF_COOKIE, "", { ...sessionCookieOptions(), httpOnly: false, maxAge: 0 });
}

export async function revokeCurrentSession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.session.updateMany({ where: { tokenHash: sha256Hex(raw) }, data: { revokedAt: new Date() } });
  }
  await clearSessionCookies();
}

/**
 * Resolve the current session user from the request cookie.
 * Enforces expiry + revocation server-side. Returns null when unauthenticated.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256Hex(raw) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;
  // touch last-seen (fire and forget)
  db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
    demoData: session.user.demoData,
    sessionId: session.id,
    csrfToken: session.csrfToken,
  };
}

/** Require an authenticated user; throws AUTH_REQUIRED. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new MorivaError("AUTH_REQUIRED");
  return u;
}

/** Require one of the given roles; throws AUTH_FORBIDDEN. */
export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const u = await requireUser();
  if (!roles.includes(u.role)) {
    log.warn("AUTHZ_DENIED", { userId: u.id, role: u.role, required: roles.join("|") });
    throw new MorivaError("AUTH_FORBIDDEN");
  }
  return u;
}

export function isSimulatedRole(role: string): boolean {
  return role !== "INDIVIDUAL";
}

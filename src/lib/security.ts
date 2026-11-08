/**
 * Security helpers: in-memory token-bucket rate limiter (ADR-0009) and hashing utils.
 * Single-instance prototype; a multi-instance deployment needs a shared store (documented).
 */
import { createHash, randomBytes, timingSafeEqual, scryptSync } from "crypto";

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts: { capacity: number; refillPerMinute: number }): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const refillRate = opts.refillPerMinute / 60_000;
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: opts.capacity, last: now };
    buckets.set(key, b);
  }
  const elapsed = now - b.last;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * refillRate);
  b.last = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { allowed: true, remaining: Math.floor(b.tokens), retryAfterSeconds: 0 };
  }
  const waitMs = (1 - b.tokens) / refillRate;
  return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
}

/** Periodic cleanup so the map cannot grow unboundedly in the dev server. */
const MAX_BUCKETS = 10_000;
export function pruneBuckets() {
  if (buckets.size > MAX_BUCKETS) buckets.clear();
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // pepper with a fixed prototype salt — raw IPs are never stored; this is a privacy pseudonymisation, not a security control
  return sha256Hex("moriva-ip-pepper:" + ip).slice(0, 24);
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// ── password hashing (Node-standard scrypt; ADR-0003) ──
const SCRYPT_KEYLEN = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

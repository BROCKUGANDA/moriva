/**
 * Security helpers: in-memory token-bucket rate limiter (ADR-0009) and hashing utils.
 * Single-instance prototype; a multi-instance deployment needs a shared store (Redis/Upstash).
 * See docs/DECISIONS.md — limiter is per-process; horizontal scale requires REDIS_URL + sliding window.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual, scryptSync } from "crypto";

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

/** Periodic cleanup so the map cannot grow unboundedly. Per-entry TTL eviction — never clear() (would reset all limits). */
const MAX_BUCKETS = 10_000;
const BUCKET_TTL_MS = 10 * 60_000;
export function pruneBuckets() {
  if (buckets.size <= MAX_BUCKETS) {
    if (buckets.size % 100 === 0) evictStaleBuckets(Date.now());
    return;
  }
  evictStaleBuckets(Date.now());
  if (buckets.size > MAX_BUCKETS) {
    let toRemove = buckets.size - MAX_BUCKETS + 1000;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (--toRemove <= 0) break;
    }
  }
}

function evictStaleBuckets(now: number) {
  for (const [key, b] of buckets) {
    if (now - b.last > BUCKET_TTL_MS) buckets.delete(key);
  }
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  // HMAC with env secret when available; falls back to fixed prototype pepper (dev only).
  // Raw IPs are never stored; this is a privacy pseudonymisation, not a security control.
  const secret = process.env.IP_HASH_SECRET;
  if (secret) {
    return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 24);
  }
  return sha256Hex("moriva-ip-pepper:" + ip).slice(0, 24);
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // compare same-length dummy buffers to keep timing uniform on length mismatch
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

// ── password hashing (Node-standard scrypt; ADR-0003) ──
const SCRYPT_KEYLEN = 64;
const SCRYPT_VERSION = "v1";
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt$${SCRYPT_VERSION}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    // v1 format: scrypt$v1$salt$hash. Legacy (prototype): scrypt$salt$hash → treated as v1 params.
    let saltB64: string;
    let hashB64: string;
    if (parts.length === 4 && parts[0] === "scrypt") {
      saltB64 = parts[2];
      hashB64 = parts[3];
    } else if (parts.length === 3 && parts[0] === "scrypt") {
      saltB64 = parts[1];
      hashB64 = parts[2];
    } else {
      return false;
    }
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

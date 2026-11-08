/**
 * Unit tests — security primitives (ADR-0003), redacting logger (T12), rate limiter.
 */
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, sha256Hex, timingSafeEqualStr, rateLimit } from "@/lib/security";
import { redactForTest } from "@/lib/logging";
import { toApiProblem, MorivaError, ERROR_CODES } from "@/lib/errors";
import { readEnv } from "@/lib/env";

describe("password hashing (scrypt, ADR-0003)", () => {
  it("verifies a correct password", () => {
    const hash = hashPassword("Correct-Horse-42!");
    expect(verifyPassword("Correct-Horse-42!", hash)).toBe(true);
  });
  it("rejects a wrong password", () => {
    const hash = hashPassword("Correct-Horse-42!");
    expect(verifyPassword("correct-horse-42!", hash)).toBe(false);
  });
  it("produces unique salts per hash", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });
  it("rejects malformed stored hashes without throwing", () => {
    expect(verifyPassword("x", "garbage")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("token hashing", () => {
  it("sha256 is deterministic", () => {
    expect(sha256Hex("a")).toBe(sha256Hex("a"));
    expect(sha256Hex("a")).not.toBe(sha256Hex("b"));
  });
  it("timing-safe compare handles length mismatch", () => {
    expect(timingSafeEqualStr("abc", "abcd")).toBe(false);
    expect(timingSafeEqualStr("abc", "abc")).toBe(true);
  });
});

describe("redacting logger", () => {
  it("strips denylisted keys", () => {
    const out = redactForTest({ password: "secret", token: "abc", bodyText: "journal words", ok: "fine" }) as Record<string, string>;
    expect(out.password).toBe("[REDACTED]");
    expect(out.token).toBe("[REDACTED]");
    expect(out.bodyText).toBe("[REDACTED]");
    expect(out.ok).toBe("fine");
  });
  it("redacts bearer tokens and api keys inside strings", () => {
    const out = redactForTest({ s: "Authorization: Bearer abcdefghijklmno" }) as Record<string, string>;
    expect(out.s).toContain("[REDACTED_TOKEN]");
    expect(out.s).not.toContain("abcdefghijklmno");
  });
});

describe("rate limiter", () => {
  it("allows within capacity then refuses and reports retry-after", () => {
    const key = `test-${Math.random()}`;
    const first = rateLimit(key, { capacity: 2, refillPerMinute: 0.0001 });
    expect(first.allowed).toBe(true);
    rateLimit(key, { capacity: 2, refillPerMinute: 0.0001 });
    const third = rateLimit(key, { capacity: 2, refillPerMinute: 0.0001 });
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("error contract (PRD §17)", () => {
  it("maps MorivaError to ApiProblem with correct http code", () => {
    const { status, body } = toApiProblem(new MorivaError("CONSENT_REQUIRED"), "req-1");
    expect(status).toBe(ERROR_CODES.CONSENT_REQUIRED.http);
    expect(body.code).toBe("CONSENT_REQUIRED");
    expect(body.requestId).toBe("req-1");
    expect(body.retryable).toBe(false);
  });
  it("never leaks unknown error internals", () => {
    const { status, body } = toApiProblem(new Error("SQLITE_IO: secret table"), "req-2");
    expect(status).toBe(500);
    expect(body.message).toBe(ERROR_CODES.INTERNAL_ERROR.message);
    expect(body.message).not.toContain("SQLITE");
  });
});

describe("env validation (AC-TE-10)", () => {
  it("refuses demo mode in production", () => {
    expect(() =>
      readEnv({ NODE_ENV: "production", DEMO_MODE: "true", DATABASE_URL: "file:x" })
    ).toThrow(/forbidden|DEMO_MODE/i);
  });
  it("allows demo mode in development", () => {
    const env = readEnv({ NODE_ENV: "development", DEMO_MODE: "true", DATABASE_URL: "file:x" });
    expect(env.demoMode).toBe(true);
  });
  it("requires DATABASE_URL", () => {
    expect(() => readEnv({ NODE_ENV: "development", DEMO_MODE: "false" })).toThrow(/DATABASE_URL/);
  });
  it("AI flag is always clamped off (ADR-0005)", () => {
    const env = readEnv({ NODE_ENV: "development", DEMO_MODE: "false", DATABASE_URL: "file:x", AI_REFLECTION_ENABLED: "true" });
    expect(env.aiReflectionEnabled).toBe(false);
  });
});

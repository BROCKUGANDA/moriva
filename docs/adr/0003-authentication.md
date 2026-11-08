# ADR-0003 — Session authentication approach for Next.js 16

**Status:** Accepted · **Date:** 2026-11-08

## Context
The PRD and implementation prompt require a mature auth library and forbid custom password storage/cryptography. The scaffold ships next-auth v4, but next-auth v4 calls `cookies()`/`headers()` synchronously, which Next.js 15+ made asynchronous — `getServerSession` is broken on Next 16. Auth.js v5 (the compatible line) is beta. OAuth/OIDC is not available for a sandbox prototype (no external IdP, no public redirect URLs).

## Decision
Implement a minimal, server-side session system using only standard primitives:
- Passwords: `crypto.scrypt` (Node-standard KDF) with 16-byte random salt, timing-safe verification.
- Sessions: 32-byte CSPRNG opaque token; **only a SHA-256 hash of the token is stored** in a `sessions` table with user, role, expiry, revocation; browser receives an httpOnly + SameSite=Lax + Secure(production) cookie. Logout/role change revokes server-side.
- CSRF: double-submit token (cookie + required `X-CSRF-Token` header) on every mutating API route.

No custom cryptographic algorithms are designed; only standard KDF/CSPRNG usage. The module is unit-tested (hash verification, expiry, revocation, wrong-password timing-safety).

## Consequences
- Works reliably behind the sandbox gateway (no NEXTAUTH_URL redirect issues).
- Next 16 upgrade-safe (no dependency on next-auth internals).
- OIDC/enterprise SSO remains P2 (FR-ID-006) with this module behind the `identity` domain interface.
- Honest limitation: no MFA yet (FR-ID-003 is production-configuration; blocked, documented).

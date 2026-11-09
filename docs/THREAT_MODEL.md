# MORIVA — Threat Model (starter, iterated through phases)

**Scope:** hackathon prototype with synthetic data. This document is a design artifact, not an audit or compliance claim.

## 1. Assets to protect

- Assessment responses and results (sensitive wellbeing data)
- Private journal entries
- Health-context items and share payloads
- Consent ledger integrity
- Referral state integrity and shared-field payloads
- Audit trail integrity
- Safety configuration integrity (emergency contacts)
- Demo-mode boundary (must never leak into production posture)

## 2. Actors

- Individual (authenticated subject) — full control of own data
- Professional (simulated) — access limited to assigned referrals + shared fields
- Provider coordinator (simulated) — own-org referrals only
- Ops admin — aggregates + verification workflows, **no journal access by default**
- Clinical governance (simulated) — approvals only, no routine content access
- Unauthenticated visitor — public content + registration only

## 3. Trust boundaries

Browser ↔ Next.js server (session cookie + CSRF token); server ↔ DB (Prisma parameterised); server ↔ external world (none — all external integrations are absent by design; adapters exist only as interfaces with labelled local simulations).

## 4. Abuse cases and mitigations (living table)

| # | Threat | Mitigation implemented | Status |
|---|---|---|---|
| T1 | BOLA/IDOR: user A fetches user B session/result/referral/context by ID | Every domain service scopes queries by `userId` from session, never from client body; integration tests cover cross-user 404/403 | Implemented (Phase 9 tests) |
| T2 | Privilege escalation individual → professional/ops | Role stored server-side at registration/seed; guards re-read role from session store on every request; role never accepted from client | Implemented |
| T3 | Professional reads unassigned referral | Assignment check (`referral_assignments`) + org scoping in `professional` domain; test: professional B denied referral of A | Implemented |
| T4 | Consent revoked but disclosure still dispatched | `requireConsent` re-evaluated at referral transition/dispatch time with `now` check; revocation blocks `READY_TO_SEND → PENDING…` | Implemented |
| T5 | Referral replay / double-submit | Unique `idempotencyKey` + canonical request hash; duplicate key returns existing resource (`REFERRAL_DUPLICATE`); key reuse with different payload → 409 | Implemented |
| T6 | Referral state machine bypass (stale version) | Optimistic `version` column; invalid transition → `REFERRAL_STATE_CONFLICT` | Implemented |
| T7 | Stale/revoked consent race with send | Consent re-check inside the referral transaction | Implemented |
| T8 | Session theft | httpOnly, SameSite=Lax, Secure (in HTTPS), 256-bit random token, server-side revocation, expiry; re-issued on login | Implemented |
| T9 | CSRF on cookie-authenticated mutations | Double-submit CSRF token required on all mutating /api/v1 routes | Implemented |
| T10 | SQL injection | Prisma parameterised queries only; no raw string SQL | Implemented |
| T11 | XSS | React auto-escaping; no `dangerouslySetInnerHTML` for user content; security headers via next.config | Implemented |
| T12 | Sensitive data in logs/telemetry | Redacting logger denylist (answers, journal, crisis text, tokens); error mapper never returns internals | Implemented |
| T13 | Directory poisoning / spoofed provider | Verification status enum with expiry; referral creation refuses non-verified/simulated-real mixing; ops verify workflow audited | Implemented |
| T14 | Employer-style surveillance | No employer role exists; no endpoint returns individual data to any org admin | By design |
| T15 | Safety config tampering (fake emergency number) | Safety contacts live in one versioned config table with source + verified date; only ops/governance can update; changes audited | Implemented |
| T16 | Help Now unavailable | Static route + client-cached fallback copy; no DB/AI dependency for core contacts | Implemented |
| T17 | Demo credentials usable in production | `DEMO_MODE=true` refuses startup when `NODE_ENV=production` (fail-fast check in env module + auth domain) | Implemented |
| T18 | Export/deletion over-collection | Export limited to subject-owned rows; deletion request queued with retention-legal-hold explanation | Implemented |
| T19 | Rate abuse of auth/assessment/referral/AI | In-memory token-bucket limiter on sensitive routes | Implemented |
| T20 | Audit tampering by ordinary roles | No mutation/delete endpoints for audit rows; ops view is read-only | Implemented |

## 5. Out of scope (documented honestly)

- Independent penetration test, external SAST/DAST, SBOM publication, encrypted backups/restore drill, KMS-managed keys, TLS termination review, formal ASVS verification — **blocked** for a sandbox prototype; listed in KNOWN_LIMITATIONS.md.

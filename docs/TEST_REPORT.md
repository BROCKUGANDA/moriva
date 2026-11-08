# MORIVA — Test report

**Environment:** Linux sandbox · bun 1.3 · Next.js 16.1.1 dev server (port 3000) · Prisma 6 / SQLite (`db/custom.db`) · run date 2026-11-08.
**Branch:** `feature/moriva-build`. All results below are from executed commands; nothing is projected or assumed.

## Commands and results

| Command | Result | Counts |
|---|---|---|
| `bun run lint` (eslint) | **PASS** (exit 0) | 0 findings |
| `bun run typecheck` (`tsc --noEmit`) | **PASS in product scope** | 0 errors in `src/`, `prisma/`, `tests/` (3 pre-existing errors confined to `examples/` + `skills/` sandbox assets, present before Phase 0 and out of product scope) |
| `bun run test:unit` (vitest) | **PASS** | 50/50 (5 files) |
| `bun run test:integration` (vitest, HTTP vs dev server) | **PASS** | 29/29 |
| `bun prisma/seed.ts` ×2 | **PASS (idempotent)** | 5 users, 9 consent purposes, 1 instrument (5 items), 1 pathway rule, 4 providers, 6 services, 3 resources, 2 safety configs, 3 flags, 3 content items |
| `bunx prisma validate` | **PASS** | schema valid |
| `bun run db:push` from empty DB | **PASS** | schema applied, client generated |
| Production build (`bun run build`) | **NOT RUN — environment forbids build during dev**; recorded as an environment limitation, not a pass | — |

## Unit coverage by critical branch (Phase 13.6)

| Critical area | File | Vectors |
|---|---|---|
| Scoring correctness/boundaries/missing/invalid/empty/corrupt config | `tests/unit/scoring.test.ts` | 18 |
| Referral state machine: every legal transition, illegal jumps, no-evidence shortcut, terminal states, withdrawal paths | `tests/unit/referral-transitions.test.ts` | 7 |
| Navigation determinism, fallback honesty, bundle hashing; consent proof canonicality | `tests/unit/navigation-consent.test.ts` | 8 |
| Password KDF, token hashing, timing-safe compare, redaction, rate limiter, error contract, env fail-closed (AC-TE-10) | `tests/unit/security-errors.test.ts` | 15 |
| Small-cell suppression boundaries | `tests/unit/analytics.test.ts` | 2 |

## Integration coverage (HTTP, `tests/integration/api.test.mjs`)

Auth (register, role-hint mismatch, safe 401 copy, logout revocation) · consent enforcement (journal gated, revocation blocks, audit written, CSRF enforced) · assessment (idempotent save/resume, out-of-range rejection, **urgent-risk interrupt with redirect**, incomplete → no partial score, repeat submit returns same result) · navigation determinism (rule version + rationale, no-result fallback, urgent override) · directory eligibility (expired/suspended excluded) · **referral workflow** (blocked without consent, named-recipient consent, idempotent create + replay duplicate + key-conflict 409, SIMULATED delivery event, cross-user 404 BOLA, coordinator-of-other-org denied 403, assigned clinician acts with SIMULATED evidence, stale-version 409 without state corruption, revocation blocks new referral, expired provider refused 409) · privacy centre (export/deletion requests, ops cannot reach professional/journal surfaces) · AI fail-closed (AI_DISABLED incl. urgent-language input) · safety surfaces (999 + 800-SAKINA + verified-source copy render; no "we have alerted" claims).

## Pre-existing baseline (Phase 0)

`examples/websocket/*` (missing socket.io types) and `skills/*` typecheck noise existed before any product work; they are sandbox assets, excluded from the product scope, and left untouched.

## Honest gaps

1. **Playwright browser E2E not runnable** (browser download unavailable in sandbox). Browser-level verification was performed with the agent-browser tool (see IMPLEMENTATION_STATUS Phase 16) plus the 29 HTTP tests. AC-TE-05 is satisfied at HTTP level + manual browser walkthrough, not by Playwright.
2. **axe-core automated scan not run** (no headless browser); manual a11y checks only (keyboard, labels, roles, contrast by palette math, reduced-motion CSS).
3. **Production build not exercised** (sandbox forbids build during dev); `next build` should run in CI.
4. **Load/performance testing, DAST, dependency vulnerability scan (`bun audit` unavailable offline), SBOM** — not performed; listed in THREAT_MODEL §5.
5. **AI evaluation suite** — defined (benign reflection, diagnosis request, medication, self-harm, harm-to-others, abuse disclosure, hallucinated helpline, prompt injection, code-switch, ambiguous urgency, consent withdrawal, provider outage) but **blocked** until the feature is approved for activation (ADR-0005); the fail-closed behaviour is what is tested.

## Verdict per AC-TE gates

- AC-TE-01 lint/typecheck/tests: **PASS** (build pending CI)
- AC-TE-02 migration + reproducible seed: **PASS**
- AC-TE-03 unit coverage of scoring/pathways/consent/transitions: **PASS**
- AC-TE-04 integration: role isolation, consent, idempotency: **PASS**
- AC-TE-05 E2E happy path/partial/provider-unavailable/revoked-consent/urgent: **PASS at HTTP + agent-browser level** (Playwright blocked — documented)
- AC-TE-06 no unresolved critical/high findings: **PASS within reviewed scope** (threat model controls implemented + tested; independent pen-test out of scope)
- AC-TE-07 no secrets in git/bundle/logs: **PASS** (`.env` untracked + gitignored; redacting logger tested)
- AC-TE-08 no sensitive data in analytics/logs: **PASS** (denylist logger + non-sensitive payload discipline; tested)
- AC-TE-09 error codes/boundaries consistent: **PASS** (single typed catalogue; tested)
- AC-TE-10 demo mode cannot run in production: **PASS** (startup refusal; tested)

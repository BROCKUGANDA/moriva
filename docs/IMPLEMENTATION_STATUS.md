# MORIVA — Implementation Status

**Legend:** `DONE` implemented + persisted + access-controlled + error-handled + tests pass · `PARTIAL` works with explicit missing part · `SIMULATED` synthetic demonstration, labelled · `BLOCKED` needs named human/partner/legal/clinical decision · `NOT STARTED`

**Last updated:** all implementation phases executed on branch `feature/moriva-build`. Test evidence in `docs/TEST_REPORT.md`.

| Phase | Capability | Status | Evidence |
|---|---|---|---|
| 0 | Repository reconnaissance + governance docs | **DONE** | `docs/REPOSITORY_RECONNAISSANCE.md`, ARCHITECTURE, THREAT_MODEL, CLINICAL_SAFETY_BOUNDARIES, DECISIONS, ADR-0001..0005; baseline lint 0 / tsc clean (product scope) |
| 1 | Scope lock, domain schema (28 models), env fail-closed validation, error catalogue, redacting logger, security helpers | **DONE** | `prisma/schema.prisma`; `src/lib/{env,errors,logging,security,api}.ts`; seed idempotency verified ×2 |
| 2 | Brand tokens/fonts/assets, Moriva components + glyphs, public site (11 routes), Help Now | **DONE** | `src/app/globals.css`, `src/components/moriva/*`, `src/app/(public)/*`; all routes 200; safety copy verified in integration tests |
| 3 | Auth (sessions/roles/CSRF), consent service, audit, demo seed | **DONE** | `src/domains/{identity,consent,audit}/service.ts`; consent-bypass + CSRF + logout-revocation integration tests pass |
| 4 | Assessment engine (versioned registry, labelled synthetic instrument, deterministic scoring, save/resume, urgent-risk interrupt) | **DONE** | 18 scoring vectors + integration tests (idempotent upsert, incomplete→422, repeat-submit, urgent redirect) |
| 5 | Deterministic navigation engine + provider directory verification states | **DONE** | rationale + rule version in responses; expired/suspended exclusion tested |
| 6 | Referral state machine (idempotency, optimistic version, evidence sources) + simulated professional workspace | **DONE** | state-machine unit tests + integration tests (replay duplicate, key conflict, stale 409, coordinator denial, SIMULATED evidence) |
| 7 | Help Now + urgent-risk flow (offline-safe, region-configured, no fake responder) | **DONE** | bundled fallback + DB config; "no alerted responder" copy asserted in tests |
| 8 | AI reflection assistant | **BLOCKED (by design, ADR-0005)** — fail-closed implemented and tested | `AI_DISABLED` on every request; attempt audited; env flag clamped |
| 9 | Privacy centre (ledger, revoke, export/deletion requests, access history) + privacy tests | **DONE** | `/app/privacy`; BOLA/cross-user tests pass; ops cannot reach journal surface |
| 10 | Outcomes analytics (source labels, missingness, small-cell suppression) | **DONE** | `src/domains/analytics/service.ts`; `/ops/outcomes`; suppression unit-tested |
| 11 | Error contract + boundaries + empty/degraded states | **DONE** | typed ApiProblem everywhere; error.tsx/global-error.tsx/not-found.tsx |
| 12 | i18n/RTL + accessibility foundations | **DONE (shell-level)** | `dir="rtl"` verified server-rendered; full Arabic translation BLOCKED pending professional review |
| 13 | Test suite + quality gates | **DONE** | 50/50 unit + 29/29 integration + lint 0 + tsc clean; Playwright gap documented |
| 14 | Deployment preparation | **DONE (docs + env)** | `.env.example`, `docs/DEPLOYMENT.md`; production BLOCKED behind pilot gates |
| 15 | Documentation package | **DONE** | README, PRD, ARCHITECTURE, API, ERROR_CATALOG, DATA_DICTIONARY, TEST_REPORT, DEMO_SCRIPT, KNOWN_LIMITATIONS, DEPLOYMENT, THREAT_MODEL, CLINICAL_SAFETY_BOUNDARIES, DECISIONS, ADRs |
| 16 | Final acceptance walkthrough | **DONE** | agent-browser journey evidence below |

## Blocked register (named decisions absent — never invented)

| Item | Status | Required human decision |
|---|---|---|
| Approved assessment instrument (WHO-5/PHQ-9/GAD-7 rights + thresholds) | **BLOCKED** | Clinical advisor + rights confirmation → simulation-only shipped |
| Staff MFA (FR-ID-003) | **BLOCKED** | Production identity configuration |
| Live provider integration / real referral delivery | **BLOCKED** | Signed partner + contract |
| Staffed crisis responder channel | **BLOCKED** | Clinical governance + staffing |
| UAE legal/health-authority clearances, data residency | **BLOCKED** | Qualified counsel + DoH |
| AI reflection activation | **BLOCKED** | Product+clinical+privacy approvals + evaluation suite |

*(This file is updated at the end of every phase with exact commands and results.)*

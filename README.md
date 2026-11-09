# MORIVA

**Notice earlier. Find the right support.**

A privacy-first wellbeing recognition and care-navigation **prototype** built for the Future Health Digital Innovation Challenge 2026 (deadline 20 November 2026). MORIVA demonstrates a complete closed loop: voluntary self-assessment → explainable non-diagnostic result → deterministic support options → consent-authorised referral → simulated professional acknowledgement → honest follow-up and outcome reporting.

> **Boundary:** MORIVA is not an emergency service, not a diagnostic tool, not a medical device and not a licensed provider. Every account, provider, referral and outcome in this environment is **synthetic and labelled**. No clinical, regulatory, or production claims are made.

---

## Quick start

```bash
# 1. install
bun install

# 2. configure (from the template; DEMO_MODE refuses to start in production)
cp .env.example .env

# 3. create the schema and the idempotent synthetic seed
bun run db:push
bun prisma/seed.ts

# 4. run
bun run dev            # http://localhost:3000
```

## Demo accounts (DEMO_MODE only)

Shared demo password: `Moriva-Demo-2026!` — shown on the login page only because demo mode is enabled. Production startup refuses demo mode (`AC-TE-10`, enforced in `src/lib/env.ts`).

| Account | Email | Role | Surface |
|---|---|---|---|
| Demo User 01 | `demo.individual@moriva.demo` | INDIVIDUAL | `/app` |
| Demo Clinician 01 | `demo.clinician@moriva.demo` | PROFESSIONAL_SIMULATED | `/professional/inbox` |
| Demo Coordinator 01 | `demo.coordinator@moriva.demo` | PROVIDER_COORDINATOR_SIMULATED | `/professional/inbox` |
| Demo Operations 01 | `demo.ops@moriva.demo` | OPS_ADMIN_SIMULATED | `/ops` |
| Demo Governance 01 | `demo.governance@moriva.demo` | CLINICAL_GOVERNANCE_SIMULATED | `/ops` |

## Commands

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server on port 3000 (auto-run by the sandbox) |
| `bun run lint` | ESLint (passes with 0 findings) |
| `bun run typecheck` | `tsc --noEmit` (clean in product scope) |
| `bun run test:unit` | 50 vitest unit tests (scoring, transitions, security, navigation, analytics) |
| `bun run test:integration` | 29 HTTP integration tests **against the running dev server** |
| `bun run db:push` | Apply the Prisma schema |
| `bun prisma/seed.ts` | Idempotent synthetic demo seed |

## The 6–8 minute demo

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). Short version: sign in as the individual → review consents → complete the labelled synthetic assessment → result with limitations → support options with rationale → provider profile → exact share preview → consented, idempotent referral → switch to the simulated clinician → acknowledge + schedule → follow-up → outcomes dashboard (source-labelled) → trigger urgent risk → Help Now (999 / 800-SAKINA, verified sources, no fake responder claims).

## Documentation map

| Document | Content |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Canonical product requirements |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Modular monolith, domains, data flow |
| [`docs/REPOSITORY_RECONNAISSANCE.md`](docs/REPOSITORY_RECONNAISSANCE.md) | Phase 0 findings |
| [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) | Per-requirement status with evidence vocabulary |
| [`docs/CLINICAL_SAFETY_BOUNDARIES.md`](docs/CLINICAL_SAFETY_BOUNDARIES.md) | Non-diagnostic scope, instrument policy, urgent-risk behaviour |
| [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) | Assets, actors, abuse cases, mitigations |
| [`docs/API.md`](docs/API.md) | Endpoint/method/auth/error table |
| [`docs/ERROR_CATALOG.md`](docs/ERROR_CATALOG.md) | Error codes and recovery paths |
| [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Tables, fields, classification, retention |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | Commands, environments, results, honest gaps |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | Reproducible demo walkthrough |
| [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) | Blocked/simulated features (truthful) |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Environments and release checklist |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) + [`docs/adr/`](docs/adr) | Decision log and ADRs |
| [`docs/BRAND_GUIDELINES.md`](docs/BRAND_GUIDELINES.md) | Brand system (assets in `public/brand/`) |

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind 4 + shadcn/ui primitives · Prisma 6 (SQLite in the prototype, PostgreSQL-portable) · Zod · Vitest. Modular monolith with 14 domain modules (`src/domains/*`), transactional outbox, server-side sessions (ADR-0003).

## Honest status

Implemented and tested: the full individual journey, consent enforcement, assessment engine with deterministic scoring, navigation rules, provider directory verification states, referral state machine with idempotency, simulated professional workspace, Help Now, privacy centre, audit trail, ops analytics. **Simulated (labelled):** provider delivery, professional actions, demo listings. **Blocked (requires named human decisions):** approved instruments, real provider integration, staffed crisis responders, MFA, legal/health-authority clearances. AI is **fail-closed disabled** (ADR-0005). Details: [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md).

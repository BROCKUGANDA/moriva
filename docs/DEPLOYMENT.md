# MORIVA — Deployment preparation

**Status: PREVIEW / DEMO ONLY.** Production deployment is blocked until every pilot gate in PRD §23.3 has a named owner and evidence. This document describes what exists and what production would require.

## Environments

| Env | Data | Demo mode | Notes |
|---|---|---|---|
| `local` (this sandbox) | Synthetic seed | allowed (`DEMO_MODE=true`) | SQLite file DB; loopback rate-limit exemption |
| `preview` | Isolated synthetic seed | allowed | Requires fresh DB + seed; restricted access |
| `production` | **None permitted yet** | **startup refuses** (AC-TE-10) | Blocked behind gates below |

## Runtime requirements

- Node 20+/bun 1.3; single Node process serves app + API (modular monolith).
- Database: SQLite file for the prototype. **Production requires PostgreSQL** (schema is portable — ADR-0002) hosted in the UAE or an approved region after data-residency review.
- Environment variables (`.env.example`): `DATABASE_URL`, `DEMO_MODE=false`, `SESSION_TTL_HOURS`, `SMALL_CELL_THRESHOLD`. Startup fails fast on missing/invalid config; demo mode in production refuses to boot.

## Release checklist (Phase 14.4) — current status

| Gate | Status |
|---|---|
| Demo mode disabled in production | Enforced in code (`readEnv`) — verified by unit test |
| No synthetic data in production | Seed is a manual local step; not part of app startup |
| No unapproved instrument active | Registry ships SIMULATION_ONLY; enforcement tested |
| No expired emergency contacts / pathway / provider listings | Verified-date + expiry columns; expired → warnings + fallback |
| AI flag off unless approvals complete | Hard-clamped (ADR-0005) |
| No test credentials or debug endpoints | Demo logins only exist under DEMO_MODE; no debug routes exist |
| Secrets scanned | `.env` untracked, `.env.example` names only; redacting logger tested |
| Migration applied + rollback understood | `prisma db push` (prototype); production needs `migrate` + backup-first rollback runbook |
| Backup restore test | **Not performed** (no production DB) |
| HTTPS/security headers | Dev sandbox is HTTP; production requires TLS + headers at the edge (documented) |
| Access roles tested | Integration matrix: individual/professional/coordinator/ops/governance (29 tests) |
| Help Now content verified | Source URLs + last-verified dates rendered; re-check 2027-02-08 |
| Support contacts / incident owner | **BLOCKED** — named humans required |
| Privacy notice / terms approved | Prototype copy in-app; legal review **BLOCKED** |
| Clinical/regulatory gate owner sign-off | **BLOCKED** |

## Production design obligations (documented, not built)

Region/data residency decision; database encryption + tested restore; KMS/secret management; private networking + WAF + rate limits at the edge; centralised logs/metrics/traces with the existing redaction rules; patching strategy; migration/rollback runbook; incident response plan; provider integration allow-list. Until then, every surface carries the prototype/simulation labels.

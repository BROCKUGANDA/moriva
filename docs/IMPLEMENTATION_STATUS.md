# MORIVA — Implementation Status

**Legend:** `DONE` implemented + persisted + access-controlled + error-handled + tests pass · `PARTIAL` works with explicit missing part · `SIMULATED` synthetic demonstration, labelled · `BLOCKED` needs named human/partner/legal/clinical decision · `NOT STARTED`

**Last updated:** Phase 0 complete — implementation phases executing sequentially on branch `feature/moriva-build`.

| Phase | Capability | Status | Evidence |
|---|---|---|---|
| 0 | Repository reconnaissance | **DONE** | `docs/REPOSITORY_RECONNAISSANCE.md`; baseline lint exit 0; tsc clean in product scope; `GET /` 200 |
| 0 | Governance docs (architecture, threat model, clinical boundaries, decisions) | **DONE** | `docs/ARCHITECTURE.md`, `docs/THREAT_MODEL.md`, `docs/CLINICAL_SAFETY_BOUNDARIES.md`, `docs/DECISIONS.md`, `docs/adr/0001–0005` |
| 1 | Scope lock (P0 list) | **DONE** | Phase 0 §3 demo scenario locked; P0 task list in implementation prompt §1.1 adopted |
| 1 | Full domain schema + env validation + error catalogue + logging | **PARTIAL → executing** | See phase updates below |
| 2 | Brand system + public site + app shells | **NOT STARTED** | — |
| 3 | Auth/session/roles/CSRF/consent/audit | **NOT STARTED** | — |
| 4 | Assessment engine + labelled synthetic instrument + scoring tests | **NOT STARTED** | — |
| 5 | Navigation rules + provider directory | **NOT STARTED** | — |
| 6 | Referral state machine + professional simulated workspace | **NOT STARTED** | — |
| 7 | Help Now + urgent-risk flow | **NOT STARTED** | — |
| 8 | AI reflection assistant | **BLOCKED (by design, ADR-0005)** | Disabled fail-closed; requires approvals that do not exist |
| 9 | Privacy centre + privacy tests | **NOT STARTED** | — |
| 10 | Outcomes analytics | **NOT STARTED** | — |
| 11 | Error contract + resilience states | **NOT STARTED** | — |
| 12 | i18n/RTL + accessibility | **NOT STARTED** | — |
| 13 | Test suite + quality gates | **NOT STARTED** | — |
| 14 | Deployment preparation | **NOT STARTED** | — |
| 15 | Documentation package | **PARTIAL** | Phase 0 docs complete; full package due Phase 15 |
| 16 | Final acceptance walkthrough | **NOT STARTED** | — |

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

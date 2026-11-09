# MORIVA — Known limitations (truthful register)

Status vocabulary: **SIMULATED** = synthetic demonstration, labelled in UI · **BLOCKED** = requires a named human/partner/legal/clinical decision that does not exist · **PARTIAL** = works with an explicit gap.

## Simulated (by design, labelled)

| Item | Label shown to users | Detail |
|---|---|---|
| Provider listings | `SIMULATED LISTING` badge + "simulated" copy | 4 demo providers (2 referable, 1 expired, 1 suspended) exercising exclusion rules |
| Referral delivery | evidence `SIMULATED` on the timeline | No external transport exists (ADR-0004); outbox resolves to labelled internal events |
| Professional workspace | persistent `SIMULATION` banner + footer | Demo clinician/coordinator/governance accounts; every action forced to `SIMULATED` evidence |
| Demo metrics | `PROTOTYPE — SIMULATED DATA` notice | Ops/outcome dashboards are computed from real workflow rows of synthetic users, always labelled |
| Assessment instrument | `SYNTHETIC DEMONSTRATION — NOT A VALIDATED QUESTIONNAIRE` | 5 authored items + deterministic scoring + demonstration trigger; see ADR-0006/D-006 |
| Pathway rules | `DEMO_APPROVED` status + demo note in UI | Thresholds exercise the engine; not clinically approved |
| Outbox dispatcher | docs only | In-process, single-instance (ADR-0004) |

## Blocked (never invented)

| Item | What is missing | Where it would land |
|---|---|---|
| Approved instrument (WHO-5 / PHQ / GAD) | Clinical advisor + rights confirmation | Instrument registry already supports versioned approval metadata; set status ACTIVE when approved |
| Real provider integration | Signed partner, contract, adapter credentials | Adapter boundary exists in `referrals` domain; simulated delivery would be replaced |
| Staffed crisis responder | Clinical governance + staffing + tabletop test | Help Now shows verified public contacts only; never claims a responder |
| Staff MFA (FR-ID-003) | Production identity configuration | Session module supports revocation; MFA is additive |
| UAE legal / DoH clearances, data residency | Qualified counsel + health authority | Compliance register in PRD §11.5; production deployment gated |
| AI reflection activation | Product/clinical/privacy approvals + evaluation suite | Pipeline stub fails closed (ADR-0005); evaluation suite defined in TEST_REPORT |
| OIDC/enterprise SSO (FR-ID-006) | External IdP + tenant config | P2 behind the identity domain interface |
| Live availability/pricing data | Verified provider API | Displayed honestly as "Not published — we don't invent availability" |

## PARTIAL (working, with stated gaps)

| Item | Works | Gap |
|---|---|---|
| Accessibility | Keyboard paths, focus rings, labels, aria roles, reduced-motion, contrast-checked palette, 44–48px targets | Full screen-reader walkthrough across every flow not performed; axe-core automated scan not run in sandbox |
| Arabic/RTL | Shell-level `dir="rtl"` dictionary + layout switches (verified server-rendered) | No professional translation; instrument content English-only by policy |
| Playwright E2E | HTTP-level integration journey (29 tests) + agent-browser manual walkthrough | Playwright browsers not installable in this sandbox — recorded as environment limitation |
| Production build | Dev-server verification + typecheck + lint | `bun run build` not permitted by the sandbox during development — production build untested here |
| Notifications | In-app notification rows + neutral copy | No email/SMS channel (no transport) |
| Export | JSON summary request with completed status | Full ZIP data export not generated in-prototype |
| Deletion | Request queued with honest retention note | No automated erasure job in-prototype |

## Environment constraints (sandbox)

- Single exposed port; no separate worker process → in-process outbox dispatcher.
- No PostgreSQL binary → SQLite (ADR-0002); Postgres RLS not available → authorization enforced in service layer + integration tests.
- Loopback requests skip rate limiting in non-production demo mode (integration testing + gateway proxying); production limits everything.

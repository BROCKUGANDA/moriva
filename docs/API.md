# MORIVA — API reference (implemented surface)

All routes are implemented under `/api/v1`. Every response carries an `x-request-id` header and a consistent problem body on failure: `{ code, message, requestId, retryable, details? }` (PRD §16.5). Mutating requests require the `X-CSRF-Token` header (double-submit cookie); referral creation additionally requires an `Idempotency-Key` header.

Auth = session cookie (httpOnly) resolved server-side. Roles: `INDIVIDUAL`, `PROFESSIONAL_SIMULATED`, `PROVIDER_COORDINATOR_SIMULATED`, `OPS_ADMIN_SIMULATED`, `CLINICAL_GOVERNANCE_SIMULATED`.

| Endpoint | Method | Auth | Purpose / side effects | Main errors |
|---|---|---|---|---|
| `/api/health` | GET | none | Liveness/readiness (DB + config; never AI) | — |
| `/api/v1/auth/register` | POST | none | Create INDIVIDUAL account + session; audit `AUTH_REGISTER` | VALIDATION_FAILED |
| `/api/v1/auth/login` | POST | none | Session issue; optional roleHint verified server-side; audit | AUTH_REQUIRED, AUTH_FORBIDDEN |
| `/api/v1/auth/logout` | POST | any | Revoke session server-side (FR-ID-004); audit | AUTH_REQUIRED |
| `/api/v1/me` | GET | any | Profile + consent summary + environment flags | AUTH_REQUIRED |
| `/api/v1/me/consents` | GET | any | Consent ledger (latest per purpose/recipient) | — |
| `/api/v1/me/consents` | POST | user | Grant purpose (optional named recipient); audit | VALIDATION_FAILED |
| `/api/v1/me/consents` | DELETE | user | Revoke purpose; blocks future disclosure; audit | RESOURCE_NOT_FOUND |
| `/api/v1/me/data-requests` | GET/POST | user | Export/deletion requests with honest status notes; audit | VALIDATION_FAILED |
| `/api/v1/me/access-history` | GET | user | Own audit events only | — |
| `/api/v1/check-ins` | GET/POST | user | Optional non-validated mood tag (never scored/shared) | — |
| `/api/v1/instruments` | GET | user | Registry with version metadata + `SIMULATION_ONLY` status | — |
| `/api/v1/assessment-sessions` | GET/POST | user | List own sessions / create (locks version + scoring version); audit | INSTRUMENT_* |
| `/api/v1/assessment-sessions/:id` | GET/PATCH | owner | Session state + items + responses; PATCH abandons | RESOURCE_NOT_FOUND (cross-user) |
| `/api/v1/assessment-sessions/:id/responses/:itemId` | PUT | owner | Idempotent upsert `(session,item)`; **urgent-risk → `urgentSupportTriggered` + redirect** | VALIDATION_FAILED, REFERRAL_STATE_CONFLICT |
| `/api/v1/assessment-sessions/:id/complete` | POST | owner | Deterministic scoring; repeat submits return same result | ASSESSMENT_INCOMPLETE, SCORING_CONFIG_INVALID |
| `/api/v1/assessment-sessions/:id/result` | GET | owner | Non-diagnostic explanation + limitations + content blocks | ASSESSMENT_INCOMPLETE |
| `/api/v1/support-options` | GET | user | Deterministic pathway result (`ruleVersion`, rationale codes); expired rules → PATHWAY_UNAVAILABLE | PATHWAY_UNAVAILABLE |
| `/api/v1/providers` | GET | user | Directory search; excludes suspended/expired/rejected | — |
| `/api/v1/providers/:id` | GET | user | Provider + services + verification freshness | RESOURCE_NOT_FOUND |
| `/api/v1/provider-services/:id` | GET | user | Service detail | RESOURCE_NOT_FOUND |
| `/api/v1/support-resources` | GET | user | Self-guided/community resources | — |
| `/api/v1/referrals/preview` | POST | user | **Exact share preview** (fields, values, recipient, retention) — no writes | VALIDATION_FAILED, PROVIDER_* |
| `/api/v1/referrals` | GET/POST | user | List own / create. POST: consent + eligibility re-checked, transaction {referral+event+outbox}, simulated delivery labelled | CONSENT_REQUIRED/REVOKED, PROVIDER_UNVERIFIED, REQUEST_IDEMPOTENCY_CONFLICT |
| `/api/v1/referrals/:id` | GET/PATCH | owner | Detail + timeline / user cancel | RESOURCE_NOT_FOUND (cross-user) |
| `/api/v1/referrals/:id/transitions` | POST | role-gated | Versioned state transition (optimistic locking) | REFERRAL_STATE_CONFLICT, AUTH_FORBIDDEN, CONSENT_REVOKED |
| `/api/v1/referrals/:id/follow-up` | POST | owner | Patient-reported contact / follow-up (distinct evidence type) | REFERRAL_STATE_CONFLICT |
| `/api/v1/journal` | GET/POST | user | Journal CRUD gated by JOURNAL_STORAGE consent | CONSENT_REQUIRED |
| `/api/v1/journal/:entryId` | DELETE | owner | Delete entry; audit | RESOURCE_NOT_FOUND |
| `/api/v1/health-context` | GET/POST | user | Self-reported context items | VALIDATION_FAILED |
| `/api/v1/health-context/:itemId` | DELETE | owner | Remove item | RESOURCE_NOT_FOUND |
| `/api/v1/ai/reflection` | POST | user | **Fail-closed**: always `AI_DISABLED` (ADR-0005), zero external calls; attempt audited | AI_DISABLED |
| `/api/v1/professional/referrals` | GET | prof. roles | Assigned referrals only | AUTH_FORBIDDEN |
| `/api/v1/professional/referrals/:id` | GET | assigned | Consent-scoped summary (minimum necessary); read audited | AUTH_FORBIDDEN (not assigned) |
| `/api/v1/professional/referrals/:id/{acknowledge,needs-information,schedule,decline,close,offer}` | POST | assigned | Simulated provider actions; evidence forced `SIMULATED` | REFERRAL_STATE_CONFLICT, CONSENT_REVOKED |
| `/api/v1/ops/providers` | GET | ops/gov | All listings incl. non-referrable | AUTH_FORBIDDEN |
| `/api/v1/ops/providers/:id/verify` | POST | ops | Verification workflow; cascades service status; audit | — |
| `/api/v1/ops/outcomes` | GET | ops/gov | Aggregates: numerator/denominator/period/source/missingness + suppression | — |
| `/api/v1/ops/audit` | GET | ops/gov | Security-scoped audit (read-only) | — |

Not implemented (deliberately): any endpoint that would expose journal text to ops, individual-level employer analytics, real provider transport, AI model calls, or emergency dispatch.

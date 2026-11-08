# MORIVA — Architecture

**Status:** Prototype (hackathon). Not clinically validated, not production-ready, not connected to any live provider.

## 1. Architecture style

Modular monolith: one deployable Next.js 16 application containing strict domain modules, one relational database (SQLite for the prototype), a transactional-outbox table for side effects, and adapter interfaces where external services would exist. No microservices.

## 2. Logical view

```text
Browser (individual / professional / ops roles)
   │  httpOnly session cookie + CSRF token
   ▼
Next.js App Router (port 3000)
├── Route groups: (public) · (auth) · /app (individual) · /professional · /ops · /help-now
├── API surface: /api/v1/* — validate (zod) → authenticate → authorise → domain service
└── Domain modules (src/domains/*, no React imports, no request objects)
    identity · consent · assessment · safety · navigation · directory · referrals
    professional · health-context · content · ai · analytics · audit · notifications
   ▼
Prisma client → SQLite (source of truth; PostgreSQL-portable schema discipline)
   ▼
outbox_events + audit_events (transactional, written in the same transaction as state changes)
```

Key invariants:

1. **Authorization is server-side.** Route guards (`lib/auth/guards.ts`) + per-record ownership/assignment checks inside domain services. UI hiding is never the control.
2. **Consent is enforced centrally.** `ConsentService.requireConsent({subjectId, purpose, recipient, dataCategories, now})` is called by referral and context-sharing services before any disclosure, and re-checked at dispatch time.
3. **Clinical logic is deterministic.** Scoring and pathway rules are pure, versioned TypeScript functions. No LLM participates in scoring, thresholds, care tier or safety.
4. **Safety is independent.** Help Now renders from a static region config + bundled fallback; it does not depend on AI, provider APIs, analytics or the database.
5. **Simulated ≠ real.** Demo providers are `DEMO_VERIFIED_SIMULATED`; the professional workspace renders a persistent SIMULATION banner; simulated evidence sources are distinct enum values from `PROVIDER_CONFIRMED` / `PATIENT_REPORTED`.
6. **Audit is append-only** for ordinary roles; every sensitive read/mutation writes an `audit_events` row with actor, role, purpose, outcome, correlation ID.

## 3. Data flow — primary journey

1. `POST /api/v1/auth/register` → user + profile + required-consent stubs (audit).
2. `POST /api/v1/me/consents` → immutable `consent_events` (grant), versioned wording.
3. `POST /api/v1/assessment-sessions` → locks `instrument_version_id` + scoring version; responses upserted idempotently on `(session_id, item_id)`; urgent-risk item triggers safety flow immediately (server returns `URGENT_SUPPORT_TRIGGERED`).
4. `POST /api/v1/assessment-sessions/:id/complete` → deterministic scoring → `assessment_results` with `rule_version` + limitations content version.
5. `GET /api/v1/support-options?resultId=…` → versioned pathway rules → typed options with rationale codes; expired/failed rules fall back to general options + Help Now.
6. `GET /api/v1/providers` → excludes suspended/expired/rejected listings; demo listings flagged.
7. `POST /api/v1/referrals` (Idempotency-Key) → consent re-check → transaction { referral + referral_event + audit_event + outbox_event } → `PENDING_PROVIDER_ACKNOWLEDGEMENT`.
8. Professional (simulated) inbox → acknowledge/needs-info/schedule/decline transitions guarded by state machine + optimistic version.
9. Follow-up events store `evidenceSource` ∈ {PROVIDER_CONFIRMED, PATIENT_REPORTED, SIMULATED, INTEGRATION_CONFIRMED} — never conflated.
10. `GET /api/v1/ops/outcomes` → aggregates with numerator/denominator/period/source/missingness + small-cell suppression.

## 4. Repository layout

```text
src/
  app/            route groups (public, auth, individual /app, /professional, /ops, /help-now) + api/v1
  components/     ui/ (shadcn primitives) · moriva/ (brand + domain components)
  domains/        14 domain modules: service + types (+ pure logic where applicable)
  lib/            auth/ db/ env/ errors/ logging/ security/ i18n support
prisma/           schema.prisma + seed.ts (idempotent, synthetic only)
docs/             governance, status, threat model, API, demo script, test report
tests/            unit/ (vitest, pure functions) · integration/ (HTTP against running server)
public/brand/     MORIVA SVG assets copied from the build pack
```

## 5. Cross-cutting decisions

| Decision | Choice | Rationale / ADR |
|---|---|---|
| Database | SQLite file (sandbox constraint), portable schema | ADR-0002 |
| Auth | Server-side opaque session tokens, httpOnly cookies, scrypt password hashing; next-auth v4 rejected (Next 16 incompatibility) | ADR-0003 |
| Side effects | `outbox_events` table + simulated in-process dispatcher (single-port sandbox) | ADR-0004 |
| AI | `AI_REFLECTION_ENABLED=false`; feature fails closed; disabled UI explains why | ADR-0005 |
| State machine | Explicit transition map + optimistic `version` column | PRD §14 |
| Errors | Typed `ApiProblem {code,message,requestId,retryable}` everywhere | PRD §17 |
| i18n | Locale dictionaries (en complete; ar shell-level, marked pending professional review), logical CSS properties for RTL | PRD §13.11 |

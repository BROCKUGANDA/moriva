# MORIVA — Staff Software Engineer / Forward Deployed Engineer Implementation Prompt

**Execution mode:** Terminal-first, repository-aware, evidence-driven  
**Target:** Robust hackathon prototype, demonstrable by 20 November 2026  
**Product source of truth:** `docs/01_MORIVA_PRODUCT_REQUIREMENTS_DOCUMENT.md`  
**Brand source:** `brand/BRAND_GUIDELINES.md` and supplied SVG assets  
**Product boundary:** Early wellbeing recognition and care navigation; not an AI therapist, diagnostic tool, emergency service or licensed healthcare provider.

---

# MISSION

You are acting as a Staff Software Engineer and Forward Deployed Engineer responsible for converting the MORIVA PRD into a complete, coherent, tested and demonstrable product.

Your job is not to produce an attractive landing page and stop. You must inspect the repository, discover the actual application state, preserve working systems, implement connected domain workflows, prove workflows with automated tests, and document what is genuinely operational versus simulated or blocked.

The quality bar is production-minded engineering scoped to a hackathon prototype. Do not claim that the prototype is clinically validated, regulator-approved, production-ready or connected to real healthcare providers unless evidence exists.

**The PRD defines WHAT to build. This prompt defines HOW to execute.** The PRD wins if there is an apparent conflict with a casual instruction in this prompt. Clinical safety and privacy requirements are non-negotiable.

# ABSOLUTE RULES — READ BEFORE TOUCHING CODE

1. **Inspect first.** Never overwrite or scaffold over a repository before understanding it.
2. **Preserve working functionality.** No broad rewrites, dependency upgrades or migrations without a reason, tests and rollback plan.
3. **No fake functionality.** Every visible control must work, be explicitly disabled with a reason, or be labelled as a simulation. No dead buttons, fake API calls, fabricated statuses or hard-coded “success”.
4. **No clinical invention.** Never invent a diagnosis, threshold, assessment item, translation, triage algorithm, provider credential, appointment, hotline or emergency response.
5. **No AI clinical decisions.** AI cannot diagnose, score instruments, choose care tier, clear urgent risk, prescribe or dispatch emergency services.
6. **Human oversight is real, not decorative.** A mock professional workspace must show a persistent `SIMULATION` label and must not claim a licensed human received a case.
7. **Privacy is enforced server-side.** UI hiding is not authorisation. Every record access checks identity, role, organisation/assignment, consent and purpose.
8. **Minimise data.** Use synthetic data only. Never import real patient data, screenshots, private records or personal wellbeing notes into the repository.
9. **Fail closed.** If consent, clinical configuration, provider verification, safety configuration or required policy is missing/expired, block the sensitive operation and show a safe alternative.
10. **Do not fake deployment.** Never say deployed, secure, compliant, clinically validated or production-ready without proof.
11. **No blanket 100% claims.** Report executed tests and actual coverage. “100% functionality” is not a verifiable status.
12. **Do not stop at TODOs.** Search TODO/FIXME/placeholder/mock/stub/demo and resolve, explicitly scope or disable each instance. No TODO may remain on the critical demo path.
13. **Protect secrets.** Never print, commit or expose `.env`, credentials, API keys, tokens, certificates, patient content or private URLs.
14. **Use the existing stack where sound.** Choose the smallest reliable architecture; no microservices for this time-boxed prototype.
15. **Keep Help Now independent.** It must render without AI, ordinary provider integrations or slow analytics.
16. **Never send external model data without explicit opt-in.** AI stays disabled until configuration, consent and safety evaluations are ready.
17. **Never notify employers or unrelated third parties about an individual's wellbeing or assessment.** No individual-level employer analytics.
18. **Use current challenge timing from the official page.** The referenced prototype deadline is 20 November 2026; verify if the event page changes.
19. **No real patient data in development, tests, demo, screenshots, logs or fixtures.**
20. **No fabricated live services.** Simulated provider acknowledgement must remain marked simulated at every point where a user could confuse it with real care.

---

# EXECUTION PROTOCOL

Work in ordered phases. At the end of each phase:

- Summarise files changed and domain capabilities completed.
- Run relevant tests and report exact commands and pass/fail counts.
- List failures and fix them before proceeding where possible.
- Update `docs/IMPLEMENTATION_STATUS.md` with `DONE`, `PARTIAL`, `SIMULATED`, `BLOCKED` or `NOT STARTED`.
- Record decisions/trade-offs in `docs/adr/`.
- Do not call a feature complete if backend, persistence, permissions, error handling or tests are missing.

If a required clinical/legal/partner decision is unavailable, do not invent it. Build the configuration boundary and synthetic demonstration if useful, label it, and keep live operation disabled.

A coding model must never silently skip a phase. If context limits or tool errors interrupt execution, read `docs/IMPLEMENTATION_STATUS.md`, inspect git diff and continue from the last verified gate. Do not blindly repeat already completed migrations or destructive actions.

---

# PHASE 0 — REPOSITORY RECONNAISSANCE (MANDATORY)

## 0.1 Inventory

Inspect:

- `pwd`, repository root, git status, current branch and recent commits.
- All package manifests and lockfiles.
- Framework/runtime versions and scripts.
- Application entry points and route tree.
- Existing authentication and user/role models.
- Database schema, migrations, seeders and ORM.
- Existing UI library, tokens, fonts, icons and design assets.
- APIs, server actions, external providers, webhooks and background workers.
- Environment variable names only; never print secret values.
- CI, Docker, deploy scripts, infrastructure manifests and tests.
- TODO/FIXME/placeholder/mock/stub/demo patterns.
- Broken imports, stale components, duplicate routes and unused code.
- Existing accessibility, security and observability tooling.

Use safe commands such as:

```bash
pwd
git status --short
git branch --show-current
git log -5 --oneline
find . -maxdepth 3 -type f | sort | head -500
cat package.json 2>/dev/null || true
grep -RInE 'TODO|FIXME|PLACEHOLDER|STUB|MOCK_ONLY' src app pages server 2>/dev/null || true
```

Exclude `node_modules`, build output, caches and secrets from broad searches. Do not dump `.env` values.

## 0.2 Baseline

Run the existing lint, typecheck, unit tests, integration tests and build. Capture baseline failures separately from regressions introduced by your work. If a command is missing, document it and add a standard script after inspecting the package manager.

Record:
- command;
- exit code;
- environment;
- number of tests passed/failed/skipped;
- whether failure is pre-existing;
- logs location with sensitive data redacted.

## 0.3 Architecture report

Create/update:

- `docs/REPOSITORY_RECONNAISSANCE.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/THREAT_MODEL.md`
- `docs/CLINICAL_SAFETY_BOUNDARIES.md`
- `docs/DECISIONS.md`
- `docs/adr/0001-architecture.md`

Report existing stack, routes, modules, data flows, dependencies, weaknesses and keep/change decisions.

## 0.4 Safe working branch

Create a feature branch if permitted. Do not force-push, rewrite history or delete user work. Record uncommitted changes and preserve them. Do not reset database or wipe files before confirming the target.

**Phase 0 exit gate:** you can explain the existing application and intended end-to-end workflow before implementation. No coding before this report.

---

# PHASE 1 — PRODUCT FOUNDATION AND ARCHITECTURE

## 1.1 Scope lock

Translate the PRD into P0/P1/P2 implementation tasks. The required P0 demonstration is:

1. Individual onboarding and consent.
2. Approved assessment or clearly labelled synthetic assessment simulation.
3. Non-diagnostic result explanation.
4. Rules-based support options.
5. Provider directory seeded with clearly identified demo data.
6. Consent preview and referral creation.
7. Simulated professional referral inbox.
8. Referral status/follow-up tracking.
9. Help Now and urgent-risk flow.
10. Privacy centre and audit.
11. De-identified demo outcomes dashboard.

Build P1 only after P0 end-to-end tests pass. P2 must not delay a complete P0 demonstration.

## 1.2 Architecture default

If the repository is empty, use a TypeScript modular monolith. Preferred baseline:

- Next.js App Router for application UI and API routes.
- Strict TypeScript.
- PostgreSQL as source of truth.
- Existing mature ORM/migration tool; if none, select Prisma or Drizzle and document why.
- Zod for runtime validation.
- Tailwind + CSS variables for exact MORIVA tokens.
- Accessible UI primitives; never ship a generic component-library default theme as final design.
- Mature OIDC/auth library. Do not implement authentication or cryptography from scratch.
- Transactional outbox for side effects. Add Redis or an external queue only for an evidenced need.
- Playwright E2E; Vitest/Jest unit/integration; axe checks.
- Docker Compose for reproducible local development.
- Structured, redacted logs and OpenTelemetry-compatible traces.

If the existing stack is functional, retain it. Do not migrate frameworks for preference. Record deviations in an ADR.

## 1.3 Domain boundaries

Implement distinct modules/services for:

`identity`, `consent`, `assessment`, `safety`, `navigation`, `directory`, `referrals`, `professional`, `health-context`, `content`, `ai`, `analytics`, `audit`, `notifications`.

A route/controller should validate, authenticate and authorise, then call a domain service. Domain services must not import React components, browser globals or framework request objects. Avoid circular imports.

## 1.4 Suggested repository structure

Adapt to the actual repository; target a clean separation similar to:

```text
src/
  app/
    (public)/
    (individual)/
    professional/
    ops/
    api/v1/
  components/
    ui/
    moriva/
    navigation/
    forms/
    feedback/
  domains/
    identity/
    consent/
    assessment/
    safety/
    navigation/
    directory/
    referrals/
    professional/
    health-context/
    content/
    ai/
    analytics/
    audit/
    notifications/
  lib/
    auth/
    db/
    env/
    errors/
    logging/
    security/
    validation/
  styles/
  i18n/
db-or-prisma/
  migrations/
  seed/
public/
  brand/
docs/
  adr/
tests/
  unit/
  integration/
  e2e/
```

Do not mechanically create folders where the repo already has equivalent separation.

## 1.5 Architecture quality

- Prefer simple explicit contracts over clever abstractions.
- Avoid microservices, service mesh, Kafka or Kubernetes for the hackathon unless already required by the repository.
- Use a modular monolith with clear domain ownership and an outbox for side effects.
- Keep clinical rule evaluation deterministic and versioned.
- Keep provider integrations behind adapters with timeouts, idempotency and contract tests.
- Keep help/emergency content independent of AI and ordinary third-party APIs.
- Do not introduce a dependency without explaining its purpose and maintenance burden.

**Exit gate:** build runs, schema/migration strategy is selected, domain boundaries are documented, brand tokens load globally, no existing critical workflow has regressed.

---

# PHASE 2 — BRAND, DESIGN SYSTEM AND APP SHELL

## 2.1 Brand implementation

Use supplied assets, not approximations:

- `brand/moriva-logo-primary.svg`
- `brand/moriva-mark.svg`
- `brand/moriva-logo-reversed.svg`
- `brand/favicon.svg`
- `brand/BRAND_GUIDELINES.md`

Copy assets to the repository public asset folder. Keep SVGs editable and sanitised. Use the generated PNG only as creative reference; it is not the authoritative vector master. Use MORIVA consistently. No founder-specific positioning.

## 2.2 Tokens

Implement CSS variables from the PRD and brand guide. Create semantic aliases for text, surface, border, focus, success, warning, critical, disabled and overlay. Avoid random one-off hex values. If a new token is necessary, update both code and guide.

Palette:

- Deep Current `#122C38`
- Tidal Teal `#197F7B`
- Soft Current `#2F9B96`
- Mist `#A8D5CD`
- Signal Coral `#F29B83`
- Pearl `#F7F6F1`
- Slate `#53666D`
- Line `#DCE5E1`
- Success `#2F7A5C`
- Warning `#A96818`
- Critical `#B33C45`

Primary gradient:

```css
linear-gradient(125deg, #122C38 0%, #197F7B 62%, #2F9B96 100%)
```

Soft surface gradient:

```css
linear-gradient(135deg, #E7F3EF 0%, #F7F6F1 100%)
```

Never encode clinical risk only with colour or gradient.

## 2.3 Typography and layout

- Manrope for headings; Inter for UI.
- Arabic fallback: `"Noto Sans Arabic", "Tahoma", sans-serif`, pending visual QA.
- Use an 8 px spacing system.
- 1280 px max content width; 720 px reading width; 760 px assessment width.
- Cards 16 px radius, inputs 12 px, modals 20 px.
- Quiet shadows, clear borders, strong hierarchy.
- No glassmorphism over health content. No dark patterns.
- Do not ship unlicensed fonts; use approved web-font packages or system fallbacks.

## 2.4 Navigation shells

**Individual shell**
- Desktop: clean top/side navigation, main content, persistent Help Now entry.
- Mobile: bottom nav for Home, Check-in, Support, Referrals and Profile; Help Now stays prominent and must not be buried.

**Professional shell**
- Queue, referrals, follow-up, availability and audit.
- Keep patient content separate from general admin.

**Operations shell**
- Providers, content, instruments, pathways, safety configuration, analytics, incidents and system.

Role-specific navigation is not a security control. Every page/action still needs server-side authorisation.

## 2.5 Component inventory

Create reusable, accessible components:

- `MorivaLogo`, `MorivaMark`, `AppShell`, `PublicHeader`, `IndividualNav`, `ProfessionalNav`, `OpsNav`.
- `PageHeader`, `SectionHeading`, `Breadcrumbs`, `ResponsiveContainer`.
- `Button`, `IconButton`, `TextField`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `DateInput`, `SearchInput`.
- `Card`, `StatCard`, `StatusBadge`, `AlertBanner`, `InlineNotice`, `EmptyState`, `ErrorState`.
- `Skeleton`, `Progress`, `Stepper`, `Toast`, `Dialog`, `Drawer`, `Popover`, `Tabs`, `Tooltip`.
- `ConsentPurposeCard`, `ConsentPreview`, `InstrumentQuestion`, `AssessmentProgress`, `AssessmentResultPanel`.
- `SupportOptionCard`, `ProviderCard`, `VerificationBadge`, `ReferralTimeline`, `ReferralStatus`.
- `HelpNowPanel`, `UrgentSupportScreen`, `SimulationBanner`, `AuditTrail`.

Use Lucide-style line icons with consistent stroke. Implement the six custom glyphs in the brand guide: `signal`, `pathway`, `handoff`, `consent-key`, `care-context`, `follow-through`. Do not add random emoji as primary UI icons.

## 2.6 State design

Every interactive component defines applicable states:

- Default.
- Hover.
- Keyboard focus visible.
- Pressed/selected.
- Disabled.
- Loading.
- Error/invalid.
- Success/confirmed.
- Empty.
- Offline/degraded.

No component may be left visually undefined for an essential state.

## 2.7 Loading and shimmer

- Skeleton geometry matches final layout to minimise CLS.
- Use shimmer subtly and disable it for reduced-motion users.
- Never skeleton the Help Now content.
- Avoid one page-wide spinner. Load independent page modules independently.
- Add explicit timeout, retry and reconciliation state.
- Keep action labels stable while processing; prevent repeat submission.
- Distinguish saving, saved-by-server, queued, sent, acknowledged and completed.
- A success toast must only follow a confirmed server response.

## 2.8 Error boundaries

Implement root, route-segment and form-level error boundaries. API errors map internal codes to safe copy. Never display exception text, SQL, file paths, vendor body or protected health information.

**Exit gate:** visual QA at mobile/tablet/desktop; all buttons/navigation resolve; keyboard and screen-reader basics pass; no P0 placeholder page.

---

# PHASE 3 — DATABASE, AUTHENTICATION, CONSENT AND AUDIT

## 3.1 Database

Create a normalized, migrated schema for PRD entities. Use foreign keys, unique constraints, checks and indexes. Add `created_at`, `updated_at`, version and status where appropriate. Store UTC timestamps. Do not put all workflow state into a generic JSON document.

Core entities:
- users, profiles, roles, role assignments;
- consent purposes and immutable consent events;
- instruments, versions, items, sessions, responses, results;
- safety events/resources/config versions;
- providers, services, verification records;
- pathway rules/versions;
- referrals, referral events, assignments;
- health-context items and shares;
- notifications, outbox events;
- audit events, content items, feature flags.

Make demo seed idempotent. Use synthetic names such as `Demo User 01`; never use a real person's personal data.

## 3.2 Schema requirements

- Use UUID/ULID identifiers that are not sequentially guessable.
- Use unique constraints for idempotency and one-answer-per-item/session.
- Add indexes for `user_id`, `referral.state`, provider/service status, timestamps and consent lookup.
- Use foreign keys and restrict/cascade policy intentionally.
- Use soft deletion only where legally and operationally appropriate; do not confuse it with full erasure.
- Version mutable governance records; do not overwrite historical instrument/pathway content used in completed sessions.
- Add data classification metadata to sensitive tables/fields.
- Ensure migrations can be applied from an empty database.
- Never run destructive reset against a database whose environment is unknown.

## 3.3 Authentication

- Use mature supported library/protocol.
- Enforce server-side sessions and route guards.
- Staff MFA required in production configuration.
- Verify role and organisation membership on each sensitive request.
- Add CSRF protections for cookie-authenticated mutations as appropriate.
- Rotate/revoke sessions on security-sensitive changes.
- Never trust role IDs, user IDs or organisation IDs sent by the client.
- Avoid custom password storage or custom cryptographic protocols.

## 3.4 Demo authentication

Implement demo mode only behind explicit `DEMO_MODE=true` and an assertion that environment is not production. If process detects production, fail startup if demo mode is enabled. Seed synthetic roles and display `DEMO ENVIRONMENT — SYNTHETIC DATA` in all demo surfaces.

## 3.5 Consent enforcement

Implement a central server-side function such as:

```ts
ConsentService.requireConsent({
  subjectId,
  purpose,
  recipient,
  dataCategories,
  now
})
```

Use it from referral and context-sharing services, not just UI.

- No implicit consent.
- No bundling unrelated purposes.
- Every disclosure requires currently valid consent or a separately reviewed lawful basis.
- Revoke blocks future sharing.
- Record actor, purpose, wording version, recipient and data categories.
- Use optimistic locking for concurrent revoke/send requests.
- Recheck consent immediately before dispatch, not only when the referral draft is opened.
- A change in recipient or scope requires new consent.

## 3.6 Audit

Write audit events for authentication changes, sensitive reads, consent grant/revoke, referral create/share/state change, provider verification, pathway/instrument approval, export/deletion request, incident access, role changes and admin configuration.

Audit events must not duplicate raw clinical content. Restrict audit access and protect against mutation/deletion by ordinary roles.

**Exit gate:** consent-bypass tests pass; cross-user and cross-tenant reads are denied; demo mode cannot start in production.

---

# PHASE 4 — ASSESSMENT ENGINE

## 4.1 Build the engine, not invented clinical content

Implement a versioned instrument registry. An instrument cannot become `ACTIVE` unless required metadata exists: source, rights/permission, version, language, target population, content checksum, scoring version, clinical approver, approval date and review/expiry date.

The PRD lists WHO-5, PHQ-2/9 and GAD-2/7 as candidates for clinical review. Do not copy WHO-5 text into the app until current WHO permission/terms are confirmed. Do not assume a translation is locally validated. Do not change wording or thresholds. If approvals are absent, set `instrument.status=SIMULATION_ONLY` and display a clear simulation label.

## 4.2 Pure scoring functions

Create deterministic functions:

- `validateResponseSet(instrumentVersion, responses)`
- `calculateScore(instrumentVersion, responses)`
- `interpretScore(instrumentVersion, score)`
- `evaluateSafetyTrigger(instrumentVersion, responses)`

No LLM or external AI model may participate in scoring, threshold evaluation or care tier.

Scoring tests handle:
- complete answers;
- missing answers;
- duplicate responses;
- unexpected response values;
- retired instrument version;
- incorrect locale/version;
- empty session;
- repeated submit;
- invalid/corrupted scoring config;
- user leaves and resumes;
- integer boundary and type-coercion cases.

If the score cannot be calculated correctly, do not return a partial/estimated score. Explain the limitation and offer general support options.

## 4.3 Session lifecycle

`CREATED → IN_PROGRESS → COMPLETED → SCORED`

Exceptions: `ABANDONED`, `EXPIRED`, `CANCELLED`, `INVALIDATED_BY_INSTRUMENT_RETIREMENT`.

Save answers with idempotent upsert using `(session_id, item_id)` uniqueness. Completion validates the exact required set and immutable instrument version. Completion is immutable except through a superseding corrected session.

## 4.4 Assessment UI

- Purpose/timeframe/duration before start.
- One accessible question at a time by default.
- Clear progress.
- Save/resume.
- Neutral, non-shaming language.
- Result includes version, date, limitations and choices.
- Never display as diagnosis.
- Urgent answer interrupts before the next ordinary question and shows approved Help Now surface.
- Autosave is confirmed only after server acknowledgement.
- A network error must preserve locally unsent state only if secure local persistence is explicitly designed and reviewed; otherwise explain the answer was not confirmed.

**Exit gate:** score vectors pass; no AI scoring; unapproved instruments remain simulation-only.

---

# PHASE 5 — STEPPED NAVIGATION AND PROVIDER DIRECTORY

## 5.1 Deterministic rules engine

Create a deterministic navigation service returning a typed result. Example contract:

```ts
type NavigationResult = {
  ruleVersion: string;
  options: Array<{
    optionId: string;
    serviceCategory: string;
    rationaleCode: string;
    rationaleText: string;
    eligibilitySummary: string;
    urgencyLabel: string;
    providerServiceIds: string[];
  }>;
  requiresHumanReview: boolean;
  safetyOverride: boolean;
};
```

This is a data contract, not permission to invent clinical rules. Use clinically approved rules only. If approval is absent, return general support resources and explicitly label the pathway as a demonstration. AI output must never be an input that changes care tier.

## 5.2 Navigation rules

- Version and checksum every rule bundle.
- Record approver, effective date, expiry date, source and rollback.
- Unknown or missing input is not equivalent to low risk.
- User can choose a more intensive available support option or request professional help.
- No protected attribute-based inference unless an approved clinical/legal rule requires it.
- If rules are unavailable/expired, show safe general choices and Help Now.
- Do not silently route to a provider with stale credentials or unverified eligibility.

## 5.3 Provider directory

Implement:
- Search by service, location, language and eligibility.
- Provider verification status and scope.
- Last verified date, source and recheck date.
- Organisation and service as separate entities; organisation verification does not automatically verify every practitioner/service.
- `PENDING`, `VERIFIED`, `SUSPENDED`, `EXPIRED`, `REJECTED` statuses.
- Hide expired/suspended services from referral creation.
- Do not fabricate reviews, ratings, wait times, availability, insurance acceptance or prices.
- Provider availability is displayed only when source and timestamp are real and fresh.

Seed providers as `DEMO_VERIFIED_SIMULATED` and label clearly. This state must never be accepted by the production referral adapter as a real verified provider.

## 5.4 Search and filtering

Use debounced server query, pagination, controlled filters and clear empty/error states. Avoid sending health-intent search terms to third-party analytics. Protect directory APIs from enumeration and excessive query patterns.

**Exit gate:** no unverified/expired provider can receive a real referral; navigation rationale is visible; rule version is recorded.

---

# PHASE 6 — REFERRAL WORKFLOW AND PROFESSIONAL WORKSPACE

## 6.1 Referral preconditions

Referral creation requires:
- authenticated subject;
- valid, non-expired, non-revoked consent for named recipient and categories;
- currently eligible provider/service;
- optional assessment/result link selected by user and included in consent scope;
- idempotency key bound to canonical request hash;
- explicit user confirmation of the share preview.

Transaction creates referral + first event + audit event + outbox event atomically, or uses a transactional outbox that guarantees eventual dispatch.

## 6.2 State machine

Implement the canonical states from the PRD. Use an explicit transition map; no free string mutation. Every transition checks:
- current state;
- allowed next state;
- actor role and assignment;
- consent status where data is read/shared;
- expected version;
- required evidence source.

Use transaction and optimistic locking. Reject invalid transitions with `REFERRAL_STATE_CONFLICT`. Prevent double-click and network-retry duplicates.

## 6.3 Delivery-unknown behaviour

If external referral transport times out after submit, do not claim failure or success. Reconcile by idempotency key and query external status before any retry.

Use exact copy:
> We can’t confirm that the referral was sent yet. We’re checking its status. Please don’t submit it again.

If no external provider transport exists, the demo creates an internal simulated event and labels it as simulation. It must not masquerade as a real provider handoff.

## 6.4 Professional workspace

- Separate auth and role gate.
- Assigned referrals only.
- Consent preview before viewing shared context.
- Acknowledge, request information, schedule, decline and close.
- A simulated professional action must never be presented as a real licensed professional action.
- Persistent demo banner in synthetic mode.
- Distinguish clinical note, service operations note and patient message.
- Log every access/mutation.
- Show assignment and recipient scope.

## 6.5 Follow-up

Store provider-confirmed and patient-reported evidence separately. Reminder delivery is outbox-driven; lock-screen copy is non-sensitive. Respect user preferences, consent, local timezone and quiet hours. A reminder sent is not a successful care contact.

**Exit gate:** E2E referral with retry creates one referral; professional cannot read unshared fields; consent revocation blocks new sharing; transitions create events/audit.

---

# PHASE 7 — SAFETY AND HELP NOW

## 7.1 Safety independent of AI

Implement Help Now as a static, reliable route and globally visible entry. It must render from local/verified configuration if database, AI or provider services are degraded. Bundled/cached content has a last-verified timestamp and expiry alert.

## 7.2 Abu Dhabi configuration

Current official Abu Dhabi Public Health Center guidance for emergency mental-health situations says call 999 or go to the nearest emergency department. The Department of Health announced a 24/7 `800-SAKINA` / `800-725462` mental-health support hotline in March 2026. Verify details at build/release and store source URL and verification date.

Do not hardcode contacts in multiple components. Keep them in one region-specific configuration record and static safety fallback. Do not describe 800-SAKINA as a substitute for emergency care. Do not invent response time, live transfer or clinician roster.

## 7.3 Trigger handling

- Explicit urgent-risk response interrupts assessment/chat.
- Stop pending LLM generation.
- Show stable, accessible full-screen support surface.
- Provide call link and visible number.
- Provide nearest ED instruction.
- If outside Abu Dhabi or locale unknown, prompt region choice; do not assume geolocation.
- Record minimum safety event metadata; restrict access.
- Never show “we have alerted someone” unless a real channel returned a confirmed acknowledgement.
- Do not generate an AI response while urgent-risk UI is active.
- Do not ask the user to keep chatting as a substitute for calling emergency services.

## 7.4 Tests

- Explicit risk response route.
- Help Now works with AI disabled and ordinary APIs unavailable.
- AI provider timeout cannot suppress crisis UI.
- Expired safety contact triggers internal alert and safe fallback.
- No human responder configured means no callback promise.
- User can exit; no coercive modal trap.
- Risk branch works in mobile and with screen reader.
- Crisis event does not leak into general logs/analytics.

**Exit gate:** safety scenario is manually rehearsed and automated; no false dispatch or handoff claim.

---

# PHASE 8 — OPTIONAL AI REFLECTION ASSISTANT

Do not let AI delay P0. Only implement after P0 E2E tests pass.

## 8.1 Default off

`AI_REFLECTION_ENABLED=false` by default. It may only be enabled when:
- product owner approves use case;
- clinical/safety reviewer approves boundaries and evaluation;
- privacy reviewer approves provider, data flow and retention;
- user opts into exact processing;
- model provider terms and jurisdiction/retention are reviewed;
- safety evaluation suite passes.

## 8.2 Allowed tasks

- Explain MORIVA workflows.
- Retrieve/summarise approved educational content with reference.
- Help draft questions for a clinician.
- Offer non-prescriptive reflective prompts.

## 8.3 Prohibited tasks

- Diagnoses, prescriptions, medication changes or treatment plans.
- Instrument scoring or re-interpretation.
- Care-tier assignment.
- Crisis resolution or reassurance the user is safe.
- Autonomous referral, record update, consent update or notification.
- Unverified provider/emergency details.

## 8.4 Guarded request pipeline

1. Confirm auth session.
2. Verify user opted into AI for this exact purpose.
3. Validate message and rate limits.
4. Run deterministic safety pre-check.
5. If urgent, stop and show static safety guidance.
6. Redact unnecessary identifiers.
7. Retrieve only approved content.
8. Call model with strict bounded prompt and no side-effect tools.
9. Run output policy and citation validation.
10. Present as AI-generated.
11. Save only on explicit user action.
12. Emit a redacted audit/metric event.

If any required control fails, fail closed and use a non-AI fallback.

## 8.5 Model evaluation suite

Create synthetic test categories:
- benign reflection;
- diagnosis request;
- medication request;
- explicit self-harm;
- harm-to-other;
- abuse disclosure;
- hallucinated helpline/provider;
- prompt injection;
- request to disclose data;
- request to change consent;
- Arabic/English code-switch;
- ambiguous crisis;
- request for false reassurance;
- acute physical symptom;
- asking about another person;
- AI provider timeout;
- no retrieval result.

Record expected safe behaviour. Critical safety failures block feature-flag activation. A single manual chat is not an evaluation.

---

# PHASE 9 — PRIVACY, SECURITY AND DATA LIFECYCLE

## 9.1 Threat model

Document at minimum:
- BOLA/IDOR across users, referrals and context;
- privilege escalation from individual to clinician/admin;
- stale/revoked consent race with dispatch;
- tenant isolation failure;
- logs/analytics/traces/browser-cache/notification leakage;
- prompt injection and model leakage;
- provider spoofing and directory poisoning;
- referral replay/double-send;
- account takeover/session theft;
- admin misuse/break-glass abuse;
- database snapshot, backup and export exposure;
- XSS, CSRF, SSRF, SQL injection, open redirect and insecure upload if uploads exist;
- Help Now availability failure.

## 9.2 Controls

- Enforce authorisation in service and database layers.
- Use row-level security or equivalent tenant scoping where supported, plus application assertions.
- Encrypt sensitive data and backups; externalise key management for real deployment.
- TLS and secure cookies.
- CSP, CSRF protection, strict CORS, input validation and output encoding.
- Staff MFA and least privilege.
- Audit sensitive reads and mutations.
- Rate-limit auth, assessment, referral and AI.
- No secrets in repository; scan commits.
- Dependency lockfiles, vulnerability scanning and SBOM.
- Redacted telemetry; no raw answers/journal in logs.
- Document retention, export, deletion and legal-hold states.

## 9.3 Verification baseline

Use OWASP ASVS 5.0.0 as a verification baseline. Do not state “ASVS compliant” until applicable requirements are tested and independently reviewed. Add dependency and secret scanning to CI.

## 9.4 Privacy tests

- User A cannot fetch User B assessment/result/journal/referral/context by ID.
- Professional cannot access unassigned referral.
- Provider coordinator cannot inspect unrelated user content.
- Ops admin cannot read journal text.
- Revoked consent blocks pending dispatch.
- Changed recipient requires new consent.
- Export includes only authorised subject data.
- Logs/telemetry exclude answers and private text.
- No employer-like role has individual wellbeing endpoints.

---

# PHASE 10 — ANALYTICS AND OUTCOME MEASUREMENT

Implement analytics from workflow events, not arbitrary front-end counters.

For each dashboard KPI show:
- metric definition;
- numerator and denominator;
- observation period;
- source: patient-reported, provider-confirmed, integration-confirmed or simulated;
- missing data rate;
- small-cohort suppression state.

Never convert `unknown` into success. Never show identifiable records to the general operations dashboard. Demo metrics need persistent `SIMULATED DATA` labels and an explanation.

---

# PHASE 11 — RESILIENCE, ERROR CODES AND USER EXPERIENCE HARDENING

## 11.1 Error contract

Implement a typed error class and central mapping for all PRD error codes. Contract:

```ts
export type ApiProblem = {
  code: string;
  message: string;
  requestId: string;
  retryable: boolean;
  details?: Record<string, string | number | boolean>;
};
```

`details` must never include health data, prompt content, access token, database error or vendor raw response.

## 11.2 Retry and idempotency

- Retry only idempotent reads or writes protected by idempotency key.
- Use exponential backoff with jitter, capped attempts and absolute timeout.
- Respect `Retry-After`.
- Do not automatically repeat user-triggered emergency calls or provider creation without status reconciliation.
- Use a circuit breaker for external providers.
- Use outbox/dead-letter queue for notifications.
- Record attempt/final outcome, not sensitive payload content.

## 11.3 Empty states

Implement intentional states:
- No assessments: invite optional check-in, not a fear-based CTA.
- No referrals: explain how referral works.
- No provider results: adjust filters or show verified generic resources.
- No available services: transparently say none are currently verified; offer general options, never fabricated listings.
- No outcome data: show “Not enough data yet,” not zero/fabricated trend.
- No AI response: use non-AI fallback.

## 11.4 Error/degraded states

- API timeout.
- Offline.
- Database unavailable.
- Provider integration down.
- Consent expired/revoked.
- Instrument retired.
- Scoring invalid.
- Referral delivery unknown.
- Notification undelivered.
- Session expired.
- Role forbidden.
- Feature disabled.
- AI safety blocked.

A failed sub-panel must not blank the page. Critical safety copy must still render.

## 11.5 Required copy map

Use PRD messages for root error, assessment save failure, referral timeout, provider unavailable, expired listing, AI unavailable, consent expiry and incomplete assessment. Centralise copy for translation and clinical review.

---

# PHASE 12 — ACCESSIBILITY, LOCALISATION AND PERFORMANCE

## 12.1 Accessibility

Target WCAG 2.2 AA. Test keyboard, focus order, screen-reader labels, form errors, contrast, zoom, target size, reduced motion and non-colour state encoding. Assessment interactions have no time limit or forced progression.

## 12.2 Arabic/RTL

- Use logical CSS properties: `margin-inline`, `padding-inline`, `inset-inline`, `text-align:start`.
- Test page shell under `dir="rtl"`.
- Isolate phone numbers and URLs directionally.
- Use correct numerals per locale settings.
- Do not runtime-translate validated assessment content.
- Mark unreviewed Arabic text as pending; do not imply clinical validity.
- Check navigation icons, chevrons, breadcrumb direction and screen-reader order.

## 12.3 Performance

- Server-render public/SEO pages where appropriate.
- Lazy-load non-critical charts/heavy modules.
- Avoid large icon/UI dependencies.
- Use pagination/server-side filtering.
- Add indexes for user IDs, referral state, provider status, timestamps and consent lookup.
- Avoid N+1 queries and broad data projections.
- Add request timeout/abort behaviour.
- Track Web Vitals (LCP, INP, CLS) without sensitive content.
- Avoid unnecessary animations/video backgrounds.
- Prevent layout shift from fonts and skeletons.

---

# PHASE 13 — TESTING AND QUALITY GATES

## 13.1 Unit tests

- scoring correctness and boundaries;
- missing/invalid responses;
- instrument version retirement;
- consent validity and expiry;
- revocation race;
- pathway determinism and expired rule;
- provider eligibility/expiry;
- every referral transition;
- idempotency request hash;
- analytics numerator/denominator;
- safety trigger precedence;
- locale/timezone conversion.

## 13.2 Integration tests

- registration/session and role guard;
- assessment persistence/result;
- referral with consent, no consent, revoked consent, expired provider and concurrent request;
- professional access to assigned/unassigned referral;
- outbox retry/dead letter;
- audit records;
- data export/deletion request;
- Help Now when AI/dependencies are disabled.

## 13.3 E2E tests

1. First visit → consent → assessment simulation → result → provider profile → consent preview → referral → simulated professional acknowledgement → follow-up dashboard.
2. User declines optional AI consent; AI stays unavailable and unrelated features work.
3. User revokes referral consent before dispatch; no data is sent.
4. Double-click/network retry creates one referral.
5. Expired provider cannot receive referral.
6. User A cannot access User B URL.
7. Professional A cannot read unassigned referral B.
8. Urgent-risk response displays Help Now, stops AI and never says human contacted unless real acknowledgement exists.
9. AI disabled/provider outage does not break assessment/navigation.
10. No result for incomplete invalid instrument session.
11. Simulation banner appears everywhere simulated content is used.
12. Keyboard-only main journey.

## 13.4 Security/static analysis

- strict typecheck;
- lint;
- dependency vulnerability scan;
- secret scan;
- SAST where available;
- DAST smoke test in isolated environment;
- authorization matrix tests;
- review public routes and API schemas for sensitive data exposure;
- inspect generated JS/client payload for secrets and privileged data.

## 13.5 CI gate

Do not merge if required checks fail. Minimum scripts, adapted to the repository package manager:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
```

Include database migration check and seed test. Report unavailable tests explicitly; do not silently skip.

## 13.6 Coverage

Use coverage to find untested critical paths, not as vanity percentage. All critical branches (consent, access control, scoring, urgent risk, referral state machine and idempotency) must have direct test evidence.

---

# PHASE 14 — DEPLOYMENT PREPARATION (NO FALSE PRODUCTION CLAIM)

## 14.1 Environments

- `local`: synthetic data; demo mode allowed.
- `preview`: isolated synthetic data; restricted access.
- `production`: demo disabled, real authentication, managed secrets and approved privacy/security configuration; deployment blocked until clinical/legal/partner gates pass.

## 14.2 Environment variables

Create `.env.example` with variable names and safe placeholders only. Validate at startup. Separate public and server-only variables. Refuse to start on missing critical configuration rather than silently using insecure defaults.

## 14.3 Infrastructure

Provide Docker Compose for local application + PostgreSQL + optional mail sandbox. Production design documents:
- region/data residency decision;
- database encryption, backup and restore;
- KMS/secret management;
- private networking/firewall;
- WAF/rate limits;
- logs/metrics/traces;
- patching and dependency updates;
- migration/rollback;
- incident response;
- provider integration allow-list.

Do not select a non-UAE hosting region for live Abu Dhabi health data without documented legal/regulatory and data-transfer review.

## 14.4 Release checklist

- Demo mode disabled in production.
- No synthetic data in production.
- No unapproved instrument active.
- No expired emergency contacts/pathway/provider listing.
- AI flag off unless approvals are complete.
- No test credentials or debug endpoint.
- Secrets scanned.
- Migration applied and rollback understood.
- Backup restore test documented.
- HTTPS/security headers checked.
- Access roles tested.
- Help Now content verified.
- Support contacts and incident owner known.
- Privacy notice/terms approved.
- Clinical/regulatory gate owner signs off.

If any mandatory gate is absent, status is **PREVIEW / DEMO ONLY**, never production.

---

# PHASE 15 — DOCUMENTATION AND SUBMISSION PACKAGE

Create/update:

- `README.md` — setup, demo users, run/test commands, limitations.
- `docs/PRD.md` — canonical PRD.
- `docs/ARCHITECTURE.md` — logical and deployment architecture.
- `docs/IMPLEMENTATION_STATUS.md` — each requirement status and evidence.
- `docs/CLINICAL_SAFETY_BOUNDARIES.md` — non-diagnostic scope and gates.
- `docs/THREAT_MODEL.md` — assets, actors, trust boundaries, abuse cases and mitigations.
- `docs/DATA_DICTIONARY.md` — table/field/classification/retention.
- `docs/API.md` — endpoint/method/schema/auth/error/side-effect table.
- `docs/ERROR_CATALOG.md` — codes and recovery paths.
- `docs/DEMO_SCRIPT.md` — reproducible 6–8 minute scenario.
- `docs/KNOWN_LIMITATIONS.md` — truthful list of blocked/simulated features.
- `docs/TEST_REPORT.md` — command, environment, result, failures and coverage for critical modules.
- `docs/DEPLOYMENT.md` — preview/demo deployment and separate production gates.
- `docs/REFERENCES.md` — current official sources with checked date.
- `docs/adr/` — architectural decisions.

Submission material must distinguish:
- implemented and tested;
- implemented but not externally integrated;
- simulated using synthetic data;
- blocked pending clinical/legal/partner validation;
- future roadmap.

Never describe an unverified listing as clinically verified. Never show a simulated referral to a real provider.

---

# PHASE 16 — FINAL ACCEPTANCE AND DEMO REHEARSAL

Before declaring done:

1. Perform a fresh clone/install if possible.
2. Apply migrations from empty database.
3. Seed synthetic data.
4. Start app from documented commands.
5. Run every required test.
6. Walk the main user journey as an individual.
7. Walk referral acknowledgement as a simulated professional.
8. Attempt forbidden access as another user/role.
9. Revoke consent and confirm disclosure is blocked.
10. Run referral double-submit and timeout-reconciliation tests.
11. Trigger urgent-risk workflow with AI disabled and dependencies down.
12. Inspect screen copy for diagnostic language and false assurances.
13. Test mobile viewport, keyboard-only and Arabic RTL shell.
14. Inspect every visible button, link, menu item, form and action.
15. Search unresolved TODO/FIXME/placeholder/mock/stub.
16. Review logs, traces and analytics for accidental sensitive payloads.
17. Produce test report and implementation status.
18. Create demo release tag only after all P0 gates pass.

## Final status vocabulary

- `DONE`: implemented, persisted where applicable, access-controlled, error-handled and tests pass.
- `PARTIAL`: some behaviour works, with explicit missing part.
- `SIMULATED`: synthetic demonstration only; never a real provider/clinical action.
- `BLOCKED`: requires named human decision, provider, legal/clinical approval or credentials not available.
- `NOT STARTED`: not implemented.

Do not report “complete” if a P0 requirement is `PARTIAL`, `SIMULATED` or `BLOCKED`. Report exact status.

---

# REQUIRED TERMINAL EXECUTION STYLE

Use small, reviewable changes. Prefer one domain slice at a time. Avoid huge generated files that cannot be inspected. After each slice, run the closest tests. Use the existing package manager. Keep lockfile changes intentional.

Do not run destructive commands (`rm -rf`, database reset, force migration, force push) without inspecting the target and confirming it is safe. Preserve user work.

When a command fails:

1. Capture exit code and concise stderr.
2. Determine whether failure is pre-existing or introduced.
3. Inspect relevant code/configuration.
4. Fix root cause, not just silence the error.
5. Re-run failed command and regression tests.
6. Record unresolved blockers honestly.

When a third-party integration is missing:
- implement an adapter interface and contract tests;
- provide deterministic local simulation only if clearly labelled;
- never invent production API responses;
- document required credentials, scopes, endpoint, data classification, retry semantics, data residency and contractual approvals.

When time is short:
- protect P0 end-to-end workflow and safety first;
- reduce scope rather than lower test/safety requirements;
- freeze feature additions before final day;
- do not remove consent, security, help or fallback paths to save time.

---

# FINAL RESPONSE FORMAT FROM THE CODING AGENT

At the end, produce an engineering handoff with:

1. **What was built** — routes/modules and complete user journeys.
2. **What works** — verified functionality only.
3. **What is simulated** — each simulated integration and its label.
4. **What is blocked** — clinical, legal, provider, credentials or infrastructure dependency.
5. **Tests executed** — exact commands and pass/fail counts.
6. **Security/privacy evidence** — role matrix, consent gates, sensitive-log check, secret scan and unresolved findings.
7. **Known limitations** — no hand-waving.
8. **How to run locally** — exact commands.
9. **How to demo** — seed accounts and script.
10. **Deployment status** — local / preview / production, with evidence.
11. **Next highest-value tasks** — prioritised.

Do not conclude with a generic “everything is 100% complete”. Use evidence collected during execution.

**Begin now with Phase 0: repository reconnaissance. Do not start coding until you have reported the existing system and its constraints.**

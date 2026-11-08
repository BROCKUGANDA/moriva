# MORIVA — Data dictionary (prototype)

Classification levels: **P1** identity/contact · **P2** sensitive wellbeing content · **P3** workflow/audit · **P4** public. Retention: prototype horizon only; production schedules require legal review (PRD §11.4).

| Table | Purpose | Sensitive fields | Class | Notes |
|---|---|---|---|---|
| `User` | Accounts | email, passwordHash, displayName, role, demoData | P1/P3 | scrypt hash, never reversible; role server-assigned only |
| `UserProfile` | Locale/region/preferences | locale, timezone, ageBand (optional), preferencesJson | P1 | no health content |
| `Session` | Server-side sessions | tokenHash (sha256), csrfToken, ipHash, userAgent | P3 | raw token never stored; expiry + revocation enforced on every request |
| `Organisation` | Provider/support orgs | name, code | P4 | demo org is synthetic |
| `ConsentPurpose` | Immutable purpose wording (v1) | wordingEn/titleEn, required flag | P4 | versioned; retired rows kept |
| `ConsentEvent` | Consent ledger | purposeCode, version, recipientType/Id, dataCategories, status, proofHash | P3 | proofHash = sha256 of canonical capture; revoke writes status change, never deletion |
| `Instrument` / `InstrumentVersion` / `InstrumentItem` | Registry | contentChecksum, scoringVersion, licenceStatus, approver | P4 | shipped version is SIMULATION_ONLY |
| `AssessmentSession` | Assessment lifecycle | status, locale, scoringVersion | P2-link | owner-scoped reads only |
| `AssessmentResponse` | Individual answers | responseValue | **P2** | unique (session,item); never logged, never in analytics |
| `AssessmentResult` | Scored outcome | rawScore, interpretationCode, ruleVersion | **P2** | interpretation codes are demonstration bands, not diagnoses |
| `SafetyEvent` | Urgent-risk / Help Now events | sourceType, triggerCode, configVersion | **P2-meta** | minimum necessary — no user text; restricted access |
| `SafetyResourceConfig` | Region emergency contacts | contactPhone, sourceUrl, verifiedAt, expiresAt | P3 | single source of record + bundled fallback |
| `Provider` / `ProviderService` | Directory | verificationStatus/scope, recheckDueAt, demoData | P4 | synthetic; expired/suspended excluded from referral |
| `SupportResource` | Information/community links | title, sourceOrg/Url, verifiedAt | P4 | opening never shares identity |
| `PathwayRule` | Versioned rule bundles | rulesJson, contentHash, approver, expiry | P3 | deterministic; DEMO_APPROVED |
| `Referral` | Referral lifecycle | state, consentEventId, idempotencyKey, requestHash, sharedFields, version | P3 | idempotencyKey unique; optimistic version |
| `ReferralEvent` | Immutable timeline | eventType, evidenceSource, safeReasonCode, noteClass, noteBody | **P2 if note present** | evidence ∈ {PROVIDER_CONFIRMED, PATIENT_REPORTED, SIMULATED, INTEGRATION_CONFIRMED} |
| `ReferralAssignment` | Professional assignment | professionalId, organisationId | P3 | authorization source for professional reads |
| `FollowUp` | Follow-up tracking | dueAt, status, evidenceSource | P3 | reminder sent ≠ care contact |
| `HealthContextItem` | Self-reported context | valueText, sourceType, sensitivityClass | **P2** | user-owned; shared only via explicit share |
| `HealthContextShare` (+items) | Consent-scoped sharing | consentEventId, selected items, expiresAt/revokedAt | **P2** | withdrawal stops future access |
| `JournalEntry` | Private notes | bodyText | **P2** | gated by JOURNAL_STORAGE consent; never analysed/shared |
| `Notification` | Neutral notifications | nonSensitivePayload | P3 | copy like "You have an update in MORIVA" |
| `OutboxEvent` | Transactional side effects | payloadRedacted | P3 | redacted payload only |
| `AuditEvent` | Append-only audit | action, actor, subject, outcome, ipHash, correlationId | P3 | no mutation/delete endpoints |
| `ContentItem` | Reviewed copy blocks | title/body, reviewer, reviewDueAt | P4 | result-limitation blocks |
| `DataRequest` | Export/deletion requests | requestType, status, note | P3 | honest retention explanation |
| `FeatureFlag` | Runtime flags | key, enabled, configJson | P3 | AI flag clamped off (ADR-0005) |

## Redaction rules (enforced in `src/lib/logging.ts`)

Never logged: password fields, session tokens, CSRF tokens, assessment answers/response values, journal text, note bodies, health-context values, prompts. IP addresses stored only as truncated salted hashes in sessions/audit. Generic analytics contain no questionnaire answers, scores, or free text (PRD §11.1, AC-TE-08).

# MORIVA — Clinical Safety Boundaries

**Applies to:** all code, copy, seeds and demos in this repository.

## 1. What MORIVA is (prototype boundary)

A voluntary wellbeing **recognition and care-navigation** demonstrator. It may: collect consented self-assessment; explain a non-diagnostic result with its limitations; show deterministic support options with rationale; create consent-authorised referrals to clearly-labelled demo providers; track referral lifecycle and follow-up with honest evidence sources; display region-configured urgent-help information.

## 2. What MORIVA must never do

1. Diagnose, prescribe, recommend treatment, or imply that a screening result is a diagnosis.
2. Let AI score an instrument, choose a care tier, reinterpret a result, or clear urgent risk.
3. Claim a live provider integration, a staffed crisis responder, emergency dispatch, or a real clinician received a case.
4. Present simulated acknowledgement/confirmation as provider-confirmed or patient-reported evidence.
5. Invent clinical thresholds, instrument wording (e.g., WHO-5/PHQ-9/GAD-7 items), translations, providers, helplines or response times.
6. Bury emergency guidance behind chat, skeletons, or any dependency on AI/DB/provider APIs.
7. Allow an expired/unverified/suspended provider listing to appear as a referral destination.
8. Pre-tick optional consent or bundle purposes.
9. Produce red/green "traffic-light" mental-health charts or gamified scores.
10. Claim regulatory approval, clinical validation in Abu Dhabi, or production readiness.

## 3. Instrument policy (enforced in code)

- Every instrument version requires: source, licence status, content checksum, scoring version, clinical approver, approval date, effective and review dates before `ACTIVE`.
- No approved instrument exists for this prototype → the shipped instrument is hard-coded `status=SIMULATION_ONLY` with a persistent "Synthetic demonstration — not a validated questionnaire" label in registry, UI and result.
- Scoring: deterministic sum with table-driven band copy authored as demonstration content; one designated urgent-risk item triggers the safety flow **immediately on answer**, before the next question is shown.
- Missing required answers → no score (`ASSESSMENT_INCOMPLETE`); no estimated/partial score is ever returned.

## 4. Urgent-risk behaviour (enforced in code)

- Triggers: Help Now selection; endorsement of the designated urgent-risk item; (future) staff activation.
- Behaviour: routine flow stops; static Help Now surface renders (no AI call in flight can suppress it); Abu Dhabi configuration shows 999 + nearest-ED guidance as primary, DoH 800-SAKINA / 800-725462 as additional (not substitute) support, each with source URL and last-verified date; `tel:` links + visible digits; user can leave at any time; no "we have alerted someone" unless a real confirmed channel exists (it does not — so it is never shown); minimum-necessary safety event recorded with restricted access.

## 5. Emergency content source of record

- Abu Dhabi Public Health Center mental-health guidance (call 999 / nearest ED): https://www.adphc.gov.ae/en/Public-Health-Programs/Mental-Health
- DoH Abu Dhabi 24/7 mental-health support hotline 800-SAKINA / 800-725462 (announced 3 March 2026): https://www.mediaoffice.abudhabi/en/health/department-of-health-abu-dhabi-activates-24-7-mental-health-support-hotline-800-sakina/
- Last checked for this build: 8 November 2026 (from build pack REFERENCES.md). Re-verify before any external demo or release.

## 6. Human-oversight honesty

The professional workspace is a **simulation**. Every surface renders the persistent SIMULATION banner; events created there carry `SIMULATED` evidence source; dashboards separate `SIMULATED` from `PROVIDER_CONFIRMED`/`PATIENT_REPORTED`. No state implies a licensed human acted.

## 7. Gates that keep this prototype non-production

Named clinical advisor approval; UAE counsel/DoH review; instrument rights; signed provider partner; staffed crisis protocol; security testing; data residency decision — all **absent**; therefore: no production claims, AI disabled, demo mode only. See KNOWN_LIMITATIONS.md.

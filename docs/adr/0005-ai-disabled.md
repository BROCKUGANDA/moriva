# ADR-0005 — AI reflection assistant ships disabled (fail-closed)

**Status:** Accepted · **Date:** 2026-11-08

## Context
PRD §20 and Phase 8 allow an optional AI reflection assistant only after product/clinical/privacy approvals, user opt-in, provider-terms review and a passing safety evaluation suite. None of these exist in the sandbox. Absolute rule 16 forbids sending any data to an external model without explicit opt-in; rule 5 forbids AI clinical decisions.

## Decision
- `AI_REFLECTION_ENABLED=false` enforced in `src/lib/env.ts` + `feature_flags` seed.
- The assistant surface renders a disabled state with the exact reason ("not approved in this prototype") and the non-AI fallback paths (support options, Help Now).
- The guarded request pipeline (consent check → deterministic safety pre-check → redaction → retrieval → bounded call → output policy) is implemented as a **fail-closed stub adapter**: any call attempt returns `AI_DISABLED` and emits an audit event; no network call is possible.
- The evaluation suite (§8.5) is defined in `docs/TEST_REPORT.md` as blocked-pending-activation.

## Consequences
- Zero risk of clinical AI behaviour or external data transfer in the demo.
- Enabling later is a configuration + approvals task, not a redesign.

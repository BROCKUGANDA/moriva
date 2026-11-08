# ADR-0004 — Transactional outbox with in-process simulated dispatcher

**Status:** Accepted · **Date:** 2026-11-08

## Context
Referral and consent side effects (provider delivery, notifications) need reliable, auditable side-effect records. PRD §18 requires a transactional outbox. The sandbox exposes a single port and forbids extra long-running infrastructure; Redis/queues would violate "add only with evidenced need".

## Decision
`outbox_events` table written **in the same transaction** as the state change. A small in-process dispatcher (invoked on API lifecycle ticks) processes pending rows, marks `published_at`/`attempts`, and demonstrates dead-letter handling with `last_error`. Because no external provider transport exists, dispatched events for referrals resolve to internal `SIMULATED` delivery events only, visibly labelled. There is no real dispatch and none is claimed.

## Consequences
- Honest semantics: "queued → simulated delivery (demo)" never presented as real handoff.
- Production would replace the dispatcher with a real worker + signed provider adapter; the event contract already exists.

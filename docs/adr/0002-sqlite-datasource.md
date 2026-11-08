# ADR-0002 — SQLite datasource for the prototype with PostgreSQL-portable schema

**Status:** Accepted · **Date:** 2026-11-08

## Context
PRD prefers PostgreSQL. The execution sandbox provides no PostgreSQL server binary; the environment-provided `DATABASE_URL` uses the `file:` protocol (SQLite via Prisma).

## Decision
Use Prisma + SQLite for the hackathon prototype. Schema discipline: UUID-style ids (cuid), explicit foreign keys with intentional delete policies, unique constraints for idempotency and one-answer-per-item, indexes on `userId`, `state`, verification status and consent lookups, UTC datetimes, enums stored as constrained text with app-level zod validation — so switching `datasource` to PostgreSQL later is a configuration change plus migration regen, not a redesign.

## Consequences
- No row-level security (Postgres RLS unavailable) → authorisation enforced entirely in domain services + guards, with integration tests. Recorded as a security limitation.
- No concurrent-write pressure expected in demo; optimistic `version` columns still implemented for referral transitions.
- Production deployment requires the hosting/data-residency review in PRD §11.5/§14.3 before any real data (kept disabled).

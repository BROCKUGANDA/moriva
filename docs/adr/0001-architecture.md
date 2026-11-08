# ADR-0001 — Modular monolith on Next.js App Router

**Status:** Accepted · **Date:** 2026-11-08

## Context
Empty repository (scaffold only). PRD §16 mandates a modular monolith for the hackathon with strict domain modules, relational source of truth, outbox where needed and adapters for external services.

## Decision
Single Next.js 16 application (App Router) with `src/domains/*` modules that never import React or request objects; API routes under `/api/v1` validate → authenticate → authorise → delegate to domain services. shadcn/ui retained as primitives only; MORIVA visual identity implemented on top via tokens.

## Consequences
- One deployable, one DB, one port — matches sandbox and time-box.
- Domain extraction later is possible because services are framework-free.
- Long-lived background workers are out of scope; outbox dispatcher runs in-process and is labelled as simulation.

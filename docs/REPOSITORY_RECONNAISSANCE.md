# MORIVA — Repository Reconnaissance Report

**Phase:** 0 — Repository reconnaissance (mandatory)
**Executed:** 8 November 2026 (challenge day 1; prototype deadline 20 November 2026)
**Working branch:** `feature/moriva-build` (created from `main` @ initial scaffold commit)
**Mode:** Terminal-first, evidence-driven. No application code was overwritten. No destructive command was run.

---

## 1. What was found

### 1.1 Repository contents

| Location | Content | Verdict |
|---|---|---|
| `/` (git root) | Fresh git repo, branch `main`, single scaffold commit | Clean history, nothing to preserve beyond scaffold |
| `upload/MORIVA_Future_Health_Challenge_Build_Pack.zip` | User-supplied build pack (spec only) | Extracted to `product-spec/`, read completely |
| `product-spec/…` | PRD.md (1,338 lines), implementation prompt (1,139 lines), brand guidelines, 8 brand SVG/PNG assets, REFERENCES.md, synthetic demo seed JSON | Specification + assets only. **Contains no application code.** |
| `src/app/page.tsx` | Placeholder landing page (Z.ai scaffold logo) | Scaffold default — replaced later as part of Phase 2, not user work |
| `src/app/api/route.ts` | `GET /api` → `{ message: "Hello, world!" }` | Scaffold default hello-world |
| `src/app/layout.tsx` | Root layout with Geist fonts + toaster | Scaffold default |
| `src/components/ui/*` (48 files) | Full shadcn/ui component set (New York style) | Retained as UI primitives, per PRD §16.2 ("component library only as primitives") |
| `src/lib/db.ts`, `src/lib/utils.ts` | Prisma client singleton, `cn()` helper | Retained |
| `prisma/schema.prisma` | Sample `User`/`Post` models (scaffold demo) | Replaced by the MORIVA domain schema in Phase 1 (documented in ADR-0002) |
| `tests/` | 3 shell scripts (scaffold runtime builders) — no test runner | Vitest added in Phase 4+ |
| `examples/websocket/`, `mini-services/`, `skills/` | Sandbox tooling, unrelated to product | Left untouched |
| `.env` | Single variable `DATABASE_URL` (value not printed per rules) | Names inventoried only |
| `Caddyfile`, `.zscripts/` | Sandbox gateway + auto dev runner | Retained, not modified |

### 1.2 Stack (as scaffolded, retained per PRD §16.2 "if the repository already has a coherent stack, retain it")

- Next.js 16.1.1 App Router, React 19, TypeScript 5 (strict via tsconfig)
- Tailwind CSS 4 + 48 shadcn/ui primitives + lucide-react icons
- Prisma 6.11 with **SQLite** datasource (`DATABASE_URL` → file-based DB). No PostgreSQL server binary exists in this sandbox.
- Zod 4, react-hook-form, TanStack Query, Zustand, next-intl, next-themes, sonner available
- next-auth v4 present in lockfile but **incompatible with Next 16 async `cookies()`/`headers()` APIs** (`getServerSession` breaks on Next ≥15). Decision recorded in ADR-0003.
- bun runtime/package manager; dev server auto-run by sandbox on port 3000

### 1.3 Existing functionality

Only scaffold defaults: placeholder landing page, hello-world API route, sample Prisma models. **There is no existing MORIVA functionality, no working domain code, no existing auth, no existing tests.** Nothing was overwritten that constituted working user functionality.

### 1.4 Stubs / incomplete endpoints / security gaps (inventory)

| Item | Classification | Disposition |
|---|---|---|
| `src/app/page.tsx` placeholder branding | Stub (scaffold) | Replaced by MORIVA landing page (Phase 2) |
| `src/app/api/route.ts` hello world | Dead endpoint | Replaced by `/api/v1` surface (Phase 1+); health check moved to `/api/health` |
| `prisma/schema.prisma` User/Post | Sample models | Replaced by full MORIVA schema (Phase 1/3) |
| No authentication on any route | Security gap (absence) | Closed in Phase 3: server-side sessions, role guards, CSRF |
| No consent enforcement | Security gap (absence) | Closed in Phase 3: `ConsentService.requireConsent` server-side |
| No rate limiting / security headers | Security gap (absence) | Closed in Phase 11: rate limit + security headers |
| No audit trail | Compliance gap | Closed in Phase 3: `audit_events` + writer service |
| No tests, no CI | Quality gap | Closed Phase 4–13: vitest unit/integration + agent-browser E2E evidence |
| `examples/`, `skills/` typecheck noise | Pre-existing baseline | Excluded from product scope; recorded in TEST_REPORT |

### 1.5 Environment constraints discovered

1. **No PostgreSQL binary** in sandbox → PRD prefers PostgreSQL; SQLite selected with PostgreSQL-portable schema discipline. ADR-0002.
2. **One externally exposed port** (3000 via gateway). No separate worker/queue process → transactional outbox table with in-process dispatcher simulation, labelled as simulation. ADR-0004.
3. `bun run build` not permitted by sandbox during development → quality gate uses `tsc --noEmit` + `next lint` + dev-server integration tests instead of a production build. Recorded as environment limitation, not a passing build claim.
4. **Playwright browser download unavailable** → E2E evidence gathered with the sandbox agent-browser tooling against the running app (Phase 16) plus HTTP-level integration tests. Honest limitation in TEST_REPORT.

## 2. Baseline test capture (pre-change)

| Command | Result | Pre-existing failures |
|---|---|---|
| `bun run lint` (eslint) | exit 0, no findings | — |
| `bunx tsc --noEmit` | exit 0 with 3 errors confined to `examples/` + `skills/` (sandbox assets, outside product scope) | Yes — pre-existing |
| Dev server `GET /` | HTTP 200 | — |
| Unit/integration/E2E | No runner existed | — |

## 3. Intended end-to-end workflow (locked demo scenario)

Individual (synthetic) → registration → granular consent → labelled synthetic assessment simulation → non-diagnostic result with limitations → deterministic support options with rationale → provider discovery (demo-verified-simulated listings) → exact share preview → consented, idempotent referral → simulated professional workspace (persistent SIMULATION banner) acknowledges/schedules → follow-up recorded with evidence source → outcomes funnel (source-labelled, suppressed small cells) → privacy centre (revoke, export/deletion requests) → urgent-risk branch anywhere shows static Help Now (Abu Dhabi 999 / DoH 800-SAKINA with source + verification date; no fake responder claims).

## 4. Phase 0 exit gate

- [x] Repository inspected end-to-end; nothing of value overwritten.
- [x] Stack understood and retained; deviations recorded (ADR-0002, ADR-0003, ADR-0004).
- [x] Baseline lint/typecheck/server state captured.
- [x] Architecture, threat model, clinical boundaries, decisions log, implementation status created.
- [x] Demo scenario and role definitions locked.

# MORIVA — Error catalogue

Typed contract: `{ code, message, requestId, retryable, details? }` (`src/lib/errors.ts`). Client copy is human-readable and never contains stack traces, SQL, vendor bodies, internal IDs or clinical interpretation. Safety triggers are flow states, not exceptions.

| Code | HTTP | Retryable | Trigger | User-facing behaviour |
|---|---:|---:|---|---|
| `AUTH_REQUIRED` | 401 | no | No/expired/revoked session | Sign-in prompt; non-sensitive navigation preserved |
| `AUTH_FORBIDDEN` | 403 | no | Role/scope/assignment/CSRF failure | "You don't have access to this information." |
| `CONSENT_REQUIRED` | 403 | after consent | No consent for purpose/recipient/categories | Exact consent request shown (share preview) |
| `CONSENT_REVOKED` | 403 | after new consent | Latest consent event is REVOKED | Stop disclosure; explain revoked state |
| `CONSENT_EXPIRED` | 403 | after new consent | Consent window elapsed | "Review and approve it again before information is shared." |
| `INSTRUMENT_NOT_APPROVED` | 409 | no | No usable instrument registry entry | Disable instrument; offer general support |
| `INSTRUMENT_VERSION_EXPIRED` | 409 | no | Version retired mid-session | Do not score under stale config; restart |
| `ASSESSMENT_INCOMPLETE` | 422 | after correction | Required items missing on complete | List missing items; answers saved; no partial score |
| `SCORING_CONFIG_INVALID` | 500 | after operator fix | Band table missing/corrupt | "Result cannot be calculated right now. Your answers have been saved." |
| `URGENT_SUPPORT_TRIGGERED` | flow | never | Urgent-risk answer / Help Now | Static safety surface interrupts the flow |
| `PATHWAY_UNAVAILABLE` | 503 | backoff | No active/unexpired rule bundle | General options + Help Now (never "no support needed") |
| `PROVIDER_UNVERIFIED` | 409 | no | Recipient not referrable | Block referral; show alternatives |
| `PROVIDER_SERVICE_EXPIRED` | 409 | no | Listing expired/re-check overdue | "This service is being re-verified." Hidden from new referrals |
| `REFERRAL_DUPLICATE` | 409 | query-only | Same idempotency key re-sent | Return existing referral state |
| `REFERRAL_STATE_CONFLICT` | 409 | no blind retry | Illegal transition or stale `version` | "This referral was updated elsewhere. Refresh to see its current status." |
| `REFERRAL_DELIVERY_UNKNOWN` | 202 | query, then retry | Transport timeout (future adapters) | "We can't confirm that the referral was sent yet. We're checking its status. Please don't submit it again." |
| `REFERRAL_DELIVERY_FAILED` | 503 | backoff | Confirmed delivery failure | "The referral could not be sent. You can safely try again." |
| `PROVIDER_UNAVAILABLE` | 503 | backoff | Directory/API outage | Other options; draft retained |
| `AI_DISABLED` | 403 | no | AI requested while disabled (ADR-0005) | "The reflection assistant is unavailable. Your assessment and support options are still available." |
| `AI_PROVIDER_TIMEOUT` | 504 | one bounded retry | (future) model timeout | Non-AI fallback |
| `AI_SAFETY_BLOCK` | flow | never | (future) output policy stop | Static safe response / human options |
| `RATE_LIMITED` | 429 | yes (Retry-After) | Token bucket empty | "Too many requests. Please try again in a moment." |
| `VALIDATION_FAILED` | 422 | after correction | Zod rejection | Inline field errors |
| `RESOURCE_NOT_FOUND` | 404 | no | Missing record **or cross-user access** (indistinguishable by design) | Safe not-found screen |
| `REQUEST_IDEMPOTENCY_CONFLICT` | 409 | new key only | Key reused with different payload | "This request key was already used with different content." |
| `DEPENDENCY_UNAVAILABLE` | 503 | backoff+jitter | Infrastructure outage | Feature-specific fallback |
| `INTERNAL_ERROR` | 500 | once for idempotent reads | Unexpected error | Safe generic message + request ID |

## Degraded-mode map

| Failure | Behaviour |
|---|---|
| Database down | Help Now still renders (bundled verified copy); readiness endpoint reports `degraded`; API returns 503 |
| Rules expired/missing | PATHWAY_UNAVAILABLE → general options + Help Now |
| Instrument retired | Session completion refused with INSTRUMENT_VERSION_EXPIRED |
| Provider expired/suspended | Hidden from search; referral attempts → 409 |
| Consent revoked mid-referral | Transition path writes `WITHDRAWN_CONSENT`; professional actions blocked (CONSENT_REVOKED) |
| AI flag flipped on in env | Clamped off at startup with a logged warning (ADR-0005) |
| Demo mode in production | **Startup refused** (fail-fast) |

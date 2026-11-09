# MORIVA — Demo script (6–8 minutes, reproducible)

**Setup:** `bun run dev` running on port 3000; seed applied (`bun prisma/seed.ts`). All data synthetic.

1. **Set the boundary (30s)** — Land on `/`. Point out: "MORIVA is not a diagnosis engine and not an emergency service. It connects voluntary wellbeing recognition to appropriate support." Show the footer 999 call action and the demo banner.

2. **Individual onboarding (90s)** — `/login` → sign in with the individual demo button (`demo.individual@moriva.demo`). You land on `/app` overview. Open **Privacy centre** (`/app/privacy`) → Consents tab → "Who can see this?" for journal. Withdraw and re-grant an optional permission to show the ledger working.

3. **Assessment (60s)** — `/app/assessments` → note the **SYNTHETIC DEMONSTRATION** label, source, version, licence status, clinical approver ("NONE — synthetic demonstration"). Start → answer 3 questions → use "Skip ahead" then answer the urgent-risk item with **"Yes, with some intent"** → the flow interrupts immediately to `/help-now` (urgent-support screen). Return via "← Return to MORIVA". Start another assessment and answer everything mildly (band DEMO_MIXED or STEADIER) → **See my result**.

4. **Result honesty (60s)** — Result page: interpretation in plain language ("your responses suggest…"), instrument version, timeframe, scoring implementation ("deterministic, no AI"), clinical approver, and the **limitations** block ("what this result cannot tell you"). Point out there is no red/green traffic-light chart and no diagnosis language.

5. **Navigation (60s)** — On the result page: support options with **Rules v2026.11-demo** badge and "Why this appears" rationale per option. Open `/app/support` for the general menu. Open `/app/providers` → search; each listing shows SIMULATED LISTING badge + last-checked date.

6. **Consent and referral (90s)** — Open a provider (e.g., *Example Primary Care Service* → General primary-care consultation). Choose fields to share → **Preview what will be shared** → show the exact preview (fields with real values, purpose, retention note, consent scope, SIMULATION banner) → **I understand — share this and send the referral**. Land on the referral page: state `pending provider acknowledgement`, evidence `SIMULATED` delivery event, timeline. Note: "creation is not the same as an appointment."

7. **Human workspace (60s)** — Sign out → `/login` → **Professional (simulated)** button. Persistent SIMULATION banner. Inbox: the referral appears under **New**. Open it: consent-scoped summary only (first name, contact, reason — no answers). **Acknowledge** → then **Mark appointment scheduled**. Show the event history: actor `professional simulated`, evidence `SIMULATED`.

8. **Outcome honesty (45s)** — Sign out → **Operations** login. `/ops/outcomes`: every metric shows definition, numerator/denominator, period, **evidence source chips** (`simulated`, `patient reported`), missing/unknown counts, and small-cell suppression note. `/ops/providers`: show the EXPIRED/SUSPENDED listings that are hidden from users; flip one to PENDING and show it disappears from the individual's search. `/ops/system`: AI flag off (ADR-0005), no external integrations.

9. **Urgent scenario (60s)** — From any screen open **Help now** (top bar). Show: 999 call action with `tel:` link, nearest-ED guidance, 800-SAKINA hotline as *additional route — not a substitute*, source org + last-verified date on both, explicit region selector ("location is never detected silently"), "I have contacted help" marked as **user-reported**, and the exit path. State: "No fake responder, no fake queue time — if no staffed channel exists, we don't claim one."

10. **Close (30s)** — "The loop is closed honestly: every step shows its evidence, and the dashboard distinguishes what is real, patient-reported, or simulated. Pilot gates before production: clinical advisor, legal review, instrument rights, signed provider partner, staffed crisis protocol." (See `docs/KNOWN_LIMITATIONS.md`.)

**Keyboard-only walkthrough:** every control in the journey is reachable via Tab with visible focus; the skip link appears on first Tab.

"use client";

import { useState } from "react";

/**
 * Help Now client actions: "I have contacted help" (user-reported state, not a clinical
 * risk clearance), and the exit path. No coercion, no trap, no fake responder claims.
 */
export function HelpNowClient({ regionCode, isAuthed }: { regionCode: string; isAuthed: boolean }) {
  const [reported, setReported] = useState(false);
  return (
    <section aria-labelledby="report" className="mt-4 rounded-2xl border border-moriva-line bg-white p-4">
      <h2 id="report" className="text-sm font-bold text-moriva-ink">Have you contacted help?</h2>
      <p className="mt-1 text-xs text-moriva-slate">
        You can mark that you contacted help. This is your own report — it is not a confirmation from a provider and
        does not clear or assess anything.
      </p>
      {!reported ? (
        <button
          onClick={() => setReported(true)}
          className="mt-2 min-h-11 rounded-lg border border-moriva-teal px-4 py-2 text-sm font-semibold text-moriva-teal hover:bg-secondary"
          data-testid="report-contacted"
        >
          I have contacted help
        </button>
      ) : (
        <p role="status" className="mt-2 rounded-lg bg-[#E9F4EE] px-3 py-2 text-sm font-semibold text-state-success" data-testid="contacted-reported">
          Recorded — thank you. Marked as <span className="italic">user-reported</span>. If things change, call 999 again or go to the nearest emergency department.
        </p>
      )}
      <p className="mt-3 text-xs text-moriva-slate">
        {isAuthed ? "You can return to your MORIVA overview at any time — this page does not trap you." : "You can leave this page at any time."}
      </p>
    </section>
  );
}

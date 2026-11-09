"use client";

import Link from "next/link";

/**
 * Route-segment error boundary (PRD §15.4): safe copy, no stack traces, no data-loss claims.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="moriva-container flex min-h-[50vh] items-center justify-center py-10">
      <div role="alert" className="w-full max-w-lg rounded-2xl border border-moriva-line bg-white p-8 text-center shadow-card">
        <h1 className="font-display text-xl font-bold text-moriva-ink">MORIVA couldn't load this page</h1>
        <p className="mt-2 text-sm text-moriva-slate">
          Your saved information has not been changed. Try again or return to your dashboard.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="min-h-11 rounded-lg bg-moriva-teal px-4 py-2 text-sm font-semibold text-white hover:bg-moriva-teal-soft"
          >
            Try again
          </button>
          <Link href="/app" className="min-h-11 rounded-lg border border-moriva-line px-4 py-2 text-sm font-semibold text-moriva-slate hover:bg-muted">
            Go to my overview
          </Link>
        </div>
      </div>
    </div>
  );
}

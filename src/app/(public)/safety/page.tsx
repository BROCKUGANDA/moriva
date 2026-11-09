import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Safety" };

export default function SafetyPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Safety</h1>
      <p className="moriva-reading mt-3 text-base leading-relaxed text-moriva-slate">
        What MORIVA can do for your safety — and what it cannot. If you are in immediate danger, stop reading and call{" "}
        <a href="tel:999" className="text-lg font-bold text-state-critical">999</a> (Abu Dhabi) or your local emergency number, or go to the nearest emergency department.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="tel:999" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-state-critical px-5 py-3 font-bold text-white hover:opacity-90">
          Call 999 · Abu Dhabi emergency
        </a>
        <Link href="/help-now" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-state-critical/40 bg-[#FAEBEC] px-5 py-3 font-bold text-state-critical hover:bg-[#f5dde0]">
          Open Help Now
        </Link>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-state-success">What MORIVA can do</h2>
          <ul className="mt-3 space-y-2 text-sm text-moriva-slate">
            <li>• Show verified emergency and support contacts for your region at any time, without AI or internet-dependent features.</li>
            <li>• Interrupt the routine flow immediately when an urgent-risk answer is given, and show clear guidance.</li>
            <li>• Record that you tapped "I have contacted help" — clearly marked as your own report.</li>
            <li>• Keep an access-restricted record of safety events for governance review.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-state-critical">What MORIVA cannot do</h2>
          <ul className="mt-3 space-y-2 text-sm text-moriva-slate">
            <li>• It cannot send help to you. It is not an emergency service and cannot dispatch responders.</li>
            <li>• It cannot promise a professional is watching. In this prototype, no staffed responder channel exists — so none is offered.</li>
            <li>• It cannot clear you as "safe" or resolve a crisis. No app can.</li>
            <li>• It never reports a crisis to police, employers or family automatically.</li>
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-moriva-line bg-secondary p-6">
        <h2 className="font-display text-lg font-bold text-moriva-ink">Response limitations</h2>
        <p className="moriva-reading mt-2 text-sm leading-relaxed text-moriva-slate">
          The DoH Abu Dhabi 24/7 mental-health support hotline (800-SAKINA / 800-725462) is an additional support
          route — not a substitute for emergency services. MORIVA does not display invented response times or queue
          positions. Emergency copy is verified against official sources (last checked 8 November 2026) and expires for
          re-verification on schedule.
        </p>
        <p className="mt-2 text-xs text-moriva-slate">
          Sources: Abu Dhabi Public Health Center — Mental Health guidance; Abu Dhabi Media Office / DoH announcement
          (3 March 2026).
        </p>
      </section>
    </div>
  );
}

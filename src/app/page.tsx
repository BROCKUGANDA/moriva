import Link from "next/link";
import { MorivaLogo, MorivaMark } from "@/components/moriva/brand";
import { PublicHeader, PublicFooter } from "@/components/navigation/shells";
import { DemoBanner } from "@/components/moriva/status";
import { LandingHero } from "@/components/moriva/landing-hero";

export default function LandingPage() {
  return (
    <>
      <DemoBanner />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <LandingHero />
        <PublicLandingBody />
      </main>
      <PublicFooter />
    </>
  );
}

function PublicLandingBody() {
  return (
    <section aria-labelledby="journey-title" className="moriva-container py-14 md:py-20">
      <div className="grid gap-10 lg:grid-cols-3">
        <article className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-moriva-teal" aria-hidden>1</span>
          <h3 className="mt-3 font-display text-lg font-bold text-moriva-ink">Notice</h3>
          <p className="mt-2 text-sm leading-relaxed text-moriva-slate">
            A private, voluntary check-in or assessment helps you put words to a change in how you feel, function or
            cope. Nothing runs in the background — you choose when to reflect.
          </p>
        </article>
        <article className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-moriva-teal" aria-hidden>2</span>
          <h3 className="mt-3 font-display text-lg font-bold text-moriva-ink">Choose</h3>
          <p className="mt-2 text-sm leading-relaxed text-moriva-slate">
            See support options explained in plain language — self-guided, community, primary care, tele-mental health
            or specialist services — with the reason each option appears and any eligibility.
          </p>
        </article>
        <article className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold text-moriva-teal" aria-hidden>3</span>
          <h3 className="mt-3 font-display text-lg font-bold text-moriva-ink">Connect</h3>
          <p className="mt-2 text-sm leading-relaxed text-moriva-slate">
            Share only the fields you choose with a provider you select, then follow the referral through acknowledgement,
            appointment and follow-up — so you can see whether the handoff actually happened.
          </p>
        </article>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <section aria-labelledby="privacy-promise" className="rounded-2xl border border-moriva-line bg-white p-6">
          <h2 id="privacy-promise" className="font-display text-lg font-bold text-moriva-ink">Your responses are yours</h2>
          <ul className="mt-3 space-y-2 text-sm text-moriva-slate">
            <li>• Consent is separate for each purpose — account, assessment, journal, AI, referrals, sharing. Declining an optional one never blocks anything unrelated.</li>
            <li>• Before any referral you see exactly which fields will be shared, with whom, and for how long.</li>
            <li>• You can withdraw consent, request an export, or request deletion from the privacy centre at any time.</li>
          </ul>
          <Link href="/privacy" className="mt-4 inline-block text-sm font-semibold text-moriva-teal underline-offset-4 hover:underline">
            Read the privacy commitments →
          </Link>
        </section>
        <section aria-labelledby="oversight" className="rounded-2xl border border-moriva-line bg-white p-6">
          <h2 id="oversight" className="font-display text-lg font-bold text-moriva-ink">People, not algorithms, make care decisions</h2>
          <ul className="mt-3 space-y-2 text-sm text-moriva-slate">
            <li>• Results are screening information, never a diagnosis. Clinical judgment stays with licensed professionals.</li>
            <li>• Support navigation follows transparent, versioned rules — you always see why an option appears.</li>
            <li>• If anything suggests urgent risk, MORIVA stops and shows verified emergency guidance immediately.</li>
          </ul>
          <Link href="/our-approach" className="mt-4 inline-block text-sm font-semibold text-moriva-teal underline-offset-4 hover:underline">
            Our approach →
          </Link>
        </section>
      </div>

      <section aria-label="Important boundary" className="mt-12 rounded-2xl border border-moriva-line bg-white p-6">
        <h2 className="font-display text-lg font-bold text-moriva-ink">What MORIVA is not</h2>
        <p className="moriva-reading mt-2 text-sm leading-relaxed text-moriva-slate">
          MORIVA is not an emergency service and does not diagnose. It is a prototype built for the Future Health
          Digital Innovation Challenge 2026 — every account, provider and referral event in this demonstration is
          synthetic and labelled. If you might be in danger, call <a href="tel:999" className="font-bold text-state-critical">999</a> (Abu Dhabi) or your local emergency number right away, or go to the nearest emergency department.
        </p>
        <Link href="/help-now" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-state-critical px-4 py-2 text-sm font-bold text-white hover:opacity-90">
          Get urgent help
        </Link>
      </section>
    </section>
  );
}

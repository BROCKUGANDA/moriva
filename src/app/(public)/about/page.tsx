import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">About MORIVA</h1>
      <section className="moriva-reading mt-6 space-y-4 text-base leading-relaxed text-moriva-slate">
        <p>
          MORIVA is the working name of a prototype built for the <strong>Future Health Digital Innovation Challenge
          2026</strong> (Abu Dhabi). Its purpose is to demonstrate one idea: the gap between noticing a change in
          wellbeing and reaching appropriate support can be closed — measurably, consensually and safely.
        </p>
        <p>
          The platform demonstrates a complete closed loop: voluntary self-assessment → explainable non-diagnostic
          results → transparent support options → consent-authorised referral → simulated professional acknowledgement
          → honest follow-up and outcome reporting. It is designed so that every step shows its evidence: which
          questionnaire version produced a result, why each support option appears, exactly which fields a referral
          shares, and whether the handoff actually happened.
        </p>
        <h2 className="pt-2 font-display text-xl font-bold text-moriva-ink">Governance model (demonstrated, not claimed)</h2>
        <p>
          The prototype implements separated roles: individuals own their data; clinical governance approves
          instruments and pathway rules; operations manage provider verification without access to private content;
          professionals see only assigned, consented referrals. Approval records carry author, approver, version and
          effective dates. In this hackathon build, all professional activity is clearly-labelled simulation.
        </p>
        <h2 className="pt-2 font-display text-xl font-bold text-moriva-ink">Contact</h2>
        <p>
          For the challenge: use the submission channel on the official event page. This prototype has no production
          support desk — support contacts will be established before any real pilot, together with named clinical and
          legal accountability.
        </p>
      </section>
    </div>
  );
}

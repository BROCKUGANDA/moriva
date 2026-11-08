import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Privacy, in plain language</h1>
      <p className="moriva-reading mt-3 text-base leading-relaxed text-moriva-slate">
        This page explains what MORIVA collects, who can see it, and what you control. The full legal text is in{" "}
        <Link href="/legal/privacy" className="font-semibold text-moriva-teal underline-offset-4 hover:underline">Privacy (legal)</Link>.
      </p>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-moriva-teal">What is collected</h2>
          <ul className="mt-2 space-y-2 text-sm text-moriva-slate">
            <li>• Account basics: email, display name, language.</li>
            <li>• What you choose to record: assessment responses, journal notes, health-context fields.</li>
            <li>• Service records: consents, referrals, notification history, security audit events.</li>
          </ul>
          <p className="mt-3 text-sm font-medium text-moriva-ink">Never collected: passive signals. No location tracking, microphone, camera, keyboard or social-media monitoring.</p>
        </div>
        <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-moriva-teal">Who can see what</h2>
          <ul className="mt-2 space-y-2 text-sm text-moriva-slate">
            <li>• Your assessment answers and journal are private to you by default.</li>
            <li>• A professional sees only what you shared for a specific referral, plus fields you explicitly add.</li>
            <li>• Operations staff manage providers and system health; they cannot read journals or unshared answers.</li>
            <li>• Employers, schools and family: no access, ever.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
          <h2 className="font-display text-lg font-bold text-moriva-teal">What you control</h2>
          <ul className="mt-2 space-y-2 text-sm text-moriva-slate">
            <li>• Separate consent for each purpose — grant or withdraw at any time.</li>
            <li>• Export your data, or request deletion, from the privacy centre.</li>
            <li>• An access history shows you who accessed shared records and when.</li>
          </ul>
          <p className="mt-3 text-sm font-medium text-moriva-ink">Honest limits: records required by law (e.g., security audit) or held in backups cannot be erased instantly — the privacy centre explains this when it applies.</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-moriva-line bg-secondary p-6">
        <h2 className="font-display text-lg font-bold text-moriva-ink">No selling, no ads, no profiling</h2>
        <p className="moriva-reading mt-2 text-sm leading-relaxed text-moriva-slate">
          Wellbeing data is never sold, never used for advertising, and never used to train public AI models. Product
          analytics exclude questionnaire answers, journal text and identifiers.
        </p>
      </section>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Terms of use (prototype)</h1>
      <div className="moriva-reading mt-6 space-y-4 text-sm leading-relaxed text-moriva-slate">
        <p><strong>Prototype status.</strong> MORIVA is a hackathon prototype for the Future Health Digital Innovation Challenge 2026. It is provided as-is for demonstration. It is not a licensed healthcare provider, not a medical device, not an emergency service, and makes no claim of regulatory approval or clinical validation.</p>
        <p><strong>Synthetic data only.</strong> All accounts, providers, referrals and events in this environment are synthetic and must not be treated as real records.</p>
        <p><strong>Not medical advice.</strong> Nothing in MORIVA is medical advice. Results are screening information about your own answers. Consult a qualified professional for care decisions.</p>
        <p><strong>Emergencies.</strong> MORIVA must not be used to request emergency help. Call 999 (Abu Dhabi) or your local emergency number.</p>
        <p><strong>Your responsibilities.</strong> Use only your own account, provide accurate consent decisions, and do not misuse the service (attempting to access others' data, disrupting the service, or scraping).</p>
        <p><strong>Name.</strong> MORIVA is a working brand not cleared for trademark; these terms create no rights in the name or assets.</p>
        <p><strong>Changes.</strong> Prototype terms may change between builds; the version shown here applies to the tagged demo build.</p>
      </div>
    </div>
  );
}

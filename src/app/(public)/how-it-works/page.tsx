import type { Metadata } from "next";

export const metadata: Metadata = { title: "How MORIVA works" };

const STEPS = [
  {
    title: "1. Notice — a private check-in",
    body: "You choose when to reflect. A brief optional check-in or a structured assessment asks about the last two weeks — nothing is collected in the background, and no answer is required to use the service. Progress saves automatically; you can pause and resume.",
  },
  {
    title: "2. Understand — a screening result, not a label",
    body: "The result explains what your responses suggest, which questionnaire version produced it, when you completed it, and — just as importantly — what it cannot establish. It is not a diagnosis and never claims to be one.",
  },
  {
    title: "3. Choose — support options with reasons",
    body: "A rule-based navigator shows proportionate options: self-guided resources, community programmes, primary care, tele-mental health or specialist services. Each option shows why it appears, plus eligibility, language, location and verification details where available. You can always choose a different option or none at all.",
  },
  {
    title: "4. Connect — consented referral",
    body: "If you want a referral, you see the exact fields that will be shared, with which provider, before anything is sent. MORIVA records your consent and sends once. The provider's response is tracked in the referral timeline.",
  },
  {
    title: "5. Follow up — did the handoff happen?",
    body: "MORIVA distinguishes provider-confirmed events from things you report yourself, and shows the difference. A referral that was created is not treated as care received — the platform measures whether the next step actually happened.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">How MORIVA works</h1>
      <p className="moriva-reading mt-3 text-base leading-relaxed text-moriva-slate">
        MORIVA links voluntary wellbeing reflection to transparent support options, consented referrals and measurable
        follow-up. Here is the journey from beginning to end.
      </p>
      <ol className="mt-10 space-y-6">
        {STEPS.map((s) => (
          <li key={s.title} className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-bold text-moriva-teal">{s.title}</h2>
            <p className="moriva-reading mt-2 text-sm leading-relaxed text-moriva-slate">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl border border-moriva-line bg-secondary p-6">
        <h2 className="font-display text-lg font-bold text-moriva-ink">Always available: urgent help</h2>
        <p className="moriva-reading mt-2 text-sm leading-relaxed text-moriva-slate">
          Help Now is reachable from every screen, including this one. It shows location-appropriate emergency
          guidance from verified sources and never depends on AI or chat.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Accessibility statement</h1>
      <div className="moriva-reading mt-6 space-y-4 text-base leading-relaxed text-moriva-slate">
        <p>
          MORIVA targets <strong>WCAG 2.2 AA</strong> for this prototype. That means, in practice:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Every action is reachable and operable by keyboard, with a visible focus indicator.</li>
          <li>Forms announce errors and associate them with fields.</li>
          <li>Text and interface contrast is checked against WCAG AA; colour is never the only cue (icons and text accompany status colours).</li>
          <li>Interfaces work at 200% zoom and on small mobile screens; touch targets meet a 44–48&nbsp;px minimum.</li>
          <li>Motion is calm (160–220 ms); <code>prefers-reduced-motion</code> is respected — no pulsing alerts, no score animations, no confetti.</li>
          <li>The layout foundation supports right-to-left (Arabic) rendering; the Arabic UI shell is a preview pending professional translation review.</li>
          <li>Assessments have no time limit and no forced progression.</li>
        </ul>
        <p>
          Known gaps in this prototype are listed honestly in the project documentation (for example, screen-reader
          testing across every flow is partial). If you use assistive technology and something does not work, the
          challenge submission channel is the way to tell us during the event.
        </p>
      </div>
    </div>
  );
}

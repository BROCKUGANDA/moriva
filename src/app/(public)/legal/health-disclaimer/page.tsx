import type { Metadata } from "next";

export const metadata: Metadata = { title: "Health disclaimer" };

export default function HealthDisclaimerPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Health disclaimer</h1>
      <div className="moriva-reading mt-6 space-y-4 text-sm leading-relaxed text-moriva-slate">
        <p><strong>No diagnosis or treatment.</strong> MORIVA does not diagnose conditions, prescribe medication, or provide treatment. Assessment results are screening information derived from your own answers to a specific questionnaire version. They can be incomplete, imprecise, or affected by how you felt on the day.</p>
        <p><strong>Not a medical device.</strong> MORIVA is not a registered medical device and makes no regulated health claims. If its intended purpose were to change, a classification review with the competent authority would precede any deployment.</p>
        <p><strong>Not an emergency service.</strong> MORIVA cannot dispatch help and has no staffed crisis responder in this prototype. In an emergency call 999 (Abu Dhabi) or go to the nearest emergency department. The 800-SAKINA hotline is an additional support route, not a substitute for emergency care.</p>
        <p><strong>No outcome guarantees.</strong> No claim is made that using MORIVA improves symptoms, reduces suicide, reduces hospitalisation, or produces any clinical outcome. Outcome measurement exists to test hypotheses with a clinical partner under proper governance.</p>
        <p><strong>Instrument status.</strong> The questionnaire shipped in this prototype is a synthetic demonstration explicitly labelled as such. No validated instrument (e.g., WHO-5, PHQ, GAD) is embedded, because reproduction rights and clinical approval have not been obtained for this build.</p>
        <p><strong>Professional independence.</strong> Only licensed professionals make clinical judgments. MORIVA's simulated professional workspace does not represent real clinical action.</p>
      </div>
    </div>
  );
}

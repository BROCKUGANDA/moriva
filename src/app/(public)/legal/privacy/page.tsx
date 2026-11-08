import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy notice (legal)" };

export default function LegalPrivacyPage() {
  return (
    <div className="moriva-container py-12 md:py-16">
      <h1 className="font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">Privacy notice (legal)</h1>
      <div className="moriva-reading mt-6 space-y-4 text-sm leading-relaxed text-moriva-slate">
        <p><strong>Scope.</strong> This notice describes the data practices of the MORIVA hackathon prototype. It is not a claim of compliance with any law. Before any live processing, UAE Federal Decree-Law No. 45 of 2021 (PDPL), Federal Law No. 2 of 2019 (ICT in Health), Abu Dhabi Department of Health policies and data-residency requirements would be reviewed by qualified counsel and the competent health authority.</p>
        <p><strong>Data categories.</strong> Account data (email, display name, language); assessment responses and results; optional journal entries; optional self-reported health-context fields; consent records; referral records including shared fields and events; notification records; security and audit records (hashed IPs, access history).</p>
        <p><strong>Legal bases (prototype mapping).</strong> Account/security: necessity for the service. Assessments and sharing: your consent, purpose-specific and revocable. Audit/security records: legitimate security interest, retained per schedule.</p>
        <p><strong>Recipients.</strong> Only those you authorise: a named provider for a specific referral (exact fields shown before you confirm), and platform operations for security. No data sale, no advertising use, no employer reporting, no public AI-model training.</p>
        <p><strong>Retention & deletion.</strong> You can request export or deletion at any time. Deletion excludes records that must be retained under a legal obligation or for security (e.g., audit events, consent proofs); the request status explains exactly what was deleted, anonymised, or retained and why.</p>
        <p><strong>Your rights (demonstrated).</strong> View, export, correct, delete, withdraw consent, restrict sharing, object to optional processing — from the in-app privacy centre, with an auditable request status.</p>
        <p><strong>International transfer.</strong> The prototype runs in a development sandbox. For production, hosting region and cross-border transfer would be decided with counsel (data residency in the UAE is the assumed requirement).</p>
      </div>
    </div>
  );
}

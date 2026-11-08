import type { Metadata } from "next";
import { getSessionUser } from "@/domains/identity/service";
import { getSafetyConfig, SUPPORTED_REGIONS } from "@/domains/safety/service";
import { recordSafetyEvent } from "@/domains/safety/service";
import { db } from "@/lib/db";
import { HelpNowClient } from "@/components/moriva/help-now-client";
import { MorivaLogo } from "@/components/moriva/brand";

export const metadata: Metadata = {
  title: "Help now — urgent support",
  description: "Immediate, location-appropriate urgent help guidance. Verified contacts, always available.",
};

export const dynamic = "force-dynamic";

/**
 * Help Now (PRD §7.7, §10): static, always-reachable, never dependent on AI/DB/provider APIs.
 * If the DB is unavailable, getSafetyConfig falls back to the bundled verified copy.
 */
export default async function HelpNowPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; source?: string; trigger?: string }>;
}) {
  const sp = await searchParams;
  const region = SUPPORTED_REGIONS.some((r) => r.code === sp.region) ? sp.region! : "AE-AZ";
  const config = await getSafetyConfig(region);
  const user = await getSessionUser().catch(() => null);

  // Record a minimum-necessary safety event (no free text). Never dispatches anything.
  try {
    if (sp.source === "assessment" || sp.trigger === "urgent") {
      await recordSafetyEvent({
        subjectUserId: user?.id ?? null,
        sourceType: sp.source === "assessment" ? "ASSESSMENT_RISK_ITEM" : "HELP_NOW_SELECTION",
        triggerCode: sp.trigger ?? "DIRECT_OPEN",
        regionCode: region,
      });
    }
  } catch {
    // Safety event recording must never block rendering of emergency guidance.
  }

  // Non-sensitive in-app notice for an authenticated user (outbox-driven; no clinical text)
  try {
    if (user) {
      await db.notification.create({
        data: {
          userId: user.id,
          purpose: "SAFETY",
          templateVersion: "safety-open-v1",
          channel: "IN_APP",
          status: "SENT",
          nonSensitivePayload: JSON.stringify({ message: "Urgent help page opened", region }),
          sentAt: new Date(),
        },
      });
    }
  } catch {
    // ignore — notification is secondary
  }

  const emergency = config.contacts.find((c) => c.purpose === "EMERGENCY") ?? config.contacts.find((c) => c.isEmergency);
  const hotline = config.contacts.find((c) => c.purpose === "SUPPORT_HOTLINE");

  return (
    <div className="min-h-screen bg-[#FAEBEC]">
      <div className="moriva-container flex min-h-screen max-w-3xl flex-col py-8">
        <div className="flex items-center justify-between">
          <MorivaLogo />
          <a href="/" className="rounded-lg border border-moriva-ink/20 px-3 py-2 text-sm font-semibold text-moriva-ink hover:bg-white">
            ← Return to MORIVA
          </a>
        </div>

        <div className="mt-6" data-testid="help-now-content">
          <p className="text-sm font-bold uppercase tracking-widest text-state-critical">Urgent help</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-moriva-ink md:text-4xl">
            If you are in danger, call now
          </h1>
          <p className="mt-3 text-base leading-relaxed text-moriva-ink/80">
            MORIVA is not an emergency service and cannot send help to you. Calling emergency services or going to the
            nearest emergency department is the fastest way to get help.
          </p>

          {emergency && (
            <section aria-labelledby="emergency-contact" className="mt-6 rounded-2xl border-2 border-state-critical bg-white p-6 shadow-card">
              <h2 id="emergency-contact" className="font-display text-xl font-bold text-state-critical">
                Emergency — {emergency.sourceOrg}
              </h2>
              <a
                href={`tel:${emergency.contactPhone}`}
                className="mt-3 flex min-h-16 items-center justify-center rounded-xl bg-state-critical px-6 text-2xl font-extrabold text-white hover:opacity-90 md:text-3xl"
                data-testid="emergency-call"
              >
                Call {emergency.displayPhone}
              </a>
              <p className="mt-3 text-sm font-semibold text-moriva-ink">{emergency.notesEn}</p>
              <p className="mt-2 text-sm text-moriva-ink/70">
                Or go to your <strong>nearest emergency department</strong>. If you can, tell someone you trust what is happening.
              </p>
              <ContactSourceNote contact={emergency} />
            </section>
          )}

          {hotline && (
            <section aria-labelledby="hotline" className="mt-4 rounded-2xl border border-moriva-line bg-white p-6 shadow-card">
              <h2 id="hotline" className="font-display text-lg font-bold text-moriva-ink">{hotline.contactName}</h2>
              <a
                href={`tel:${hotline.contactPhone}`}
                className="mt-2 flex min-h-12 items-center justify-center rounded-xl border-2 border-moriva-teal px-6 text-xl font-extrabold text-moriva-teal hover:bg-secondary"
              >
                Call {hotline.displayPhone}
              </a>
              <p className="mt-2 text-sm text-moriva-ink/80">{hotline.notesEn}</p>
              <ContactSourceNote contact={hotline} />
            </section>
          )}

          <HelpNowClient regionCode={region} isAuthed={Boolean(user)} />

          {config.source === "bundled-fallback" && (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-moriva-slate" role="note">
              Showing the last verified emergency copy stored on this page. Some live services may be unavailable, but
              this information remains valid.
            </p>
          )}

          <section aria-labelledby="region" className="mt-6 rounded-2xl border border-moriva-line bg-white p-4">
            <h2 id="region" className="text-sm font-bold text-moriva-ink">Region</h2>
            <p className="mt-1 text-xs text-moriva-slate">
              Location is never detected silently — choose your region explicitly. Unknown or different region: use your
              local emergency number or go to the nearest emergency department.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUPPORTED_REGIONS.map((r) => (
                <a
                  key={r.code}
                  href={`/help-now?region=${r.code}`}
                  aria-current={r.code === region ? "true" : undefined}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    r.code === region ? "border-moriva-teal bg-secondary text-moriva-teal" : "border-moriva-line text-moriva-slate hover:bg-muted"
                  }`}
                >
                  {r.label}
                </a>
              ))}
              <span className="rounded-lg border border-dashed border-moriva-line px-3 py-2 text-sm text-moriva-slate">
                Other region: call your local emergency number
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ContactSourceNote({ contact }: { contact: { sourceOrg: string; sourceUrl: string; lastVerifiedAt: string; configExpired: boolean; expiresAt: string | null } }) {
  const verified = contact.lastVerifiedAt.slice(0, 10);
  const expired = contact.configExpired;
  return (
    <p className={`mt-3 border-t pt-2 text-xs ${expired ? "text-state-warning" : "text-moriva-slate"}`}>
      Source: <a href={contact.sourceUrl} className="underline underline-offset-2" rel="noreferrer noopener">{contact.sourceOrg}</a>
      {" "}· last verified {verified}
      {contact.expiresAt ? ` · due for re-check ${contact.expiresAt.slice(0, 10)}` : ""}
      {expired && <strong className="block text-state-warning">This contact is past its re-verification date. Treat with care and confirm locally.</strong>}
    </p>
  );
}

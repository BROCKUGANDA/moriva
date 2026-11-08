import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/domains/identity/service";
import { getOwnedSession } from "@/domains/assessment/service";
import { db } from "@/lib/db";
import { StatusBadge, SectionHeading, InlineNotice } from "@/components/moriva/status";
import { SupportOptionsAfterResult } from "@/components/moriva/support-options";

export const metadata = { title: "Assessment result" };
export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const session = await getOwnedSession(user.id, sessionId);
  if (!session.result) redirect(`/app/assessments/${sessionId}`);
  const bands = JSON.parse(session.instrumentVersion.interpretationEn || "[]") as Array<{ code: string; titleEn: string; bodyEn: string }>;
  const band = bands.find((b) => b.code === session.result!.interpretationCode) ?? null;
  const blocks = await db.contentItem.findMany({ where: { contentType: "RESULT_BLOCK", status: "REVIEWED", locale: "en" } });

  return (
    <div className="mx-auto moriva-assessment-width">
      <SectionHeading title="Your result" level={1} />
      <article className="rounded-2xl border border-moriva-line bg-white p-6 shadow-card md:p-8" data-testid="result-panel">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-moriva-slate">
            {session.instrumentVersion.instrument.displayName} · v{session.instrumentVersion.version} · {session.instrumentVersion.locale.toUpperCase()}
          </p>
          {session.instrumentVersion.instrument.status === "SIMULATION_ONLY" && (
            <StatusBadge tone="coral">SYNTHETIC DEMONSTRATION — NOT A VALIDATED QUESTIONNAIRE</StatusBadge>
          )}
        </div>

        {band && (
          <div className="mt-4">
            <h2 className="font-display text-2xl font-bold text-moriva-ink">{band.titleEn}</h2>
            <p className="mt-2 text-base leading-relaxed text-moriva-ink/85">{band.bodyEn}</p>
          </div>
        )}

        <dl className="mt-6 grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-moriva-slate">Screening result</dt>
            <dd className="font-semibold text-moriva-ink">
              {session.result.interpretationCode} ({session.result.rawScore} / 15 points in this demonstration)
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-moriva-slate">Completed</dt>
            <dd className="font-semibold text-moriva-ink">
              {session.completedAt ? new Date(session.completedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"} ({session.instrumentVersion.timeframe.replace("_", " ").toLowerCase()})
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-moriva-slate">Scoring implementation</dt>
            <dd className="font-semibold text-moriva-ink">{session.result.ruleVersion} · deterministic, no AI</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-moriva-slate">Clinical approver</dt>
            <dd className="font-semibold text-moriva-ink">{session.instrumentVersion.clinicalApprover}</dd>
          </div>
        </dl>

        <section aria-labelledby="limitations" className="mt-6">
          <h3 id="limitations" className="font-display text-lg font-bold text-moriva-teal">What this result cannot tell you</h3>
          <p className="mt-2 text-sm leading-relaxed text-moriva-slate">{session.instrumentVersion.limitationsEn}</p>
        </section>

        {blocks.length > 0 && (
          <section aria-labelledby="about-screening" className="mt-5 space-y-3">
            <h3 id="about-screening" className="font-display text-lg font-bold text-moriva-teal">About screening</h3>
            {blocks.map((b) => (
              <div key={b.id} className="rounded-xl border border-moriva-line bg-muted/50 p-4">
                <p className="text-sm font-semibold text-moriva-ink">{b.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-moriva-slate">{b.body}</p>
                <p className="mt-1 text-[11px] text-moriva-slate">Source: {b.sourceRef}</p>
              </div>
            ))}
          </section>
        )}
      </article>

      <section className="mt-8" aria-labelledby="next-steps">
        <h2 id="next-steps" className="font-display text-xl font-bold text-moriva-ink">What you can do next</h2>
        <p className="mt-1 text-sm text-moriva-slate">
          These options are suggestions, not instructions. You choose — including choosing none of them.
        </p>
        <SupportOptionsAfterResult resultId={session.result.id} />
      </section>

      <div className="mt-8">
        <InlineNotice kind="info" title="Screening is not diagnosis">
          If anything here feels worrying, talking to a professional can help you understand it. Urgent help is always
          available: <Link href="/help-now" className="font-bold text-state-critical underline">Help Now</Link>.
        </InlineNotice>
      </div>
    </div>
  );
}

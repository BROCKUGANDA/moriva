import Link from "next/link";
import { getSessionUser } from "@/domains/identity/service";
import { db } from "@/lib/db";
import { SectionHeading, StatusBadge, InlineNotice, EmptyState } from "@/components/moriva/status";
import { IndividualOverviewActions } from "@/components/moriva/overview-actions";

export const metadata = { title: "My overview" };
export const dynamic = "force-dynamic";

export default async function AppOverviewPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const [lastSession, openReferrals, consents] = await Promise.all([
    db.assessmentSession.findFirst({
      where: { userId: user.id, status: "SCORED" },
      orderBy: { completedAt: "desc" },
      include: { instrumentVersion: { include: { instrument: true } }, result: true },
    }),
    db.referral.findMany({
      where: { userId: user.id, state: { notIn: ["CLOSED", "CANCELLED_BY_USER", "WITHDRAWN_CONSENT", "DECLINED", "EXPIRED"] } },
      include: { providerService: { include: { provider: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.consentEvent.count({ where: { subjectUserId: user.id, status: "GRANTED" } }),
  ]);
  const lastBands = lastSession ? (JSON.parse(lastSession.instrumentVersion.interpretationEn || "[]") as Array<{ code: string; titleEn: string }>) : [];
  const lastBandTitle = lastBands.find((b) => b.code === lastSession?.result?.interpretationCode)?.titleEn ?? lastSession?.result?.interpretationCode;

  return (
    <div>
      <SectionHeading
        title={`Hello, ${user.displayName.split(" ")[0]}`}
        description="A private space to notice how things are going and choose what happens next. Nothing here is shared without your say-so."
        level={1}
      />
      {user.demoData && (
        <InlineNotice kind="warning" className="mb-4">
          This is a synthetic demo account. Everything you do here is demonstration data.
        </InlineNotice>
      )}

      <div className="grid gap-4 md:grid-cols-3" data-testid="overview-cards">
        <article className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-moriva-slate">Last check-in</h2>
          {lastSession?.result ? (
            <>
              <p className="mt-2 font-display text-lg font-bold text-moriva-ink">
                {lastSession.instrumentVersion.instrument.displayName}
              </p>
              <p className="mt-1 text-sm text-moriva-slate">
                {lastBandTitle} · completed{" "}
                {lastSession.completedAt ? new Date(lastSession.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
              </p>
              <Link href={`/app/assessments/${lastSession.id}/result`} className="mt-3 inline-block text-sm font-semibold text-moriva-teal underline-offset-4 hover:underline">
                View result →
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-moriva-slate">No completed check-in yet — that's okay.</p>
          )}
          <div className="mt-3 flex gap-2">
            <Link href="/app/check-in" className="min-h-11 rounded-lg bg-moriva-teal px-4 py-2 text-sm font-semibold text-white hover:bg-moriva-teal-soft">
              Brief check-in
            </Link>
            <Link href="/app/assessments" className="min-h-11 rounded-lg border border-moriva-teal px-4 py-2 text-sm font-semibold text-moriva-teal hover:bg-secondary">
              Assessments
            </Link>
          </div>
        </article>

        <article className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-moriva-slate">Open referrals</h2>
          {openReferrals.length === 0 ? (
            <p className="mt-2 text-sm text-moriva-slate">No open referrals. Explore support options to create one when you're ready.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {openReferrals.map((r) => (
                <li key={r.id} className="rounded-lg border border-moriva-line px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/app/referrals/${r.id}`} className="text-sm font-semibold text-moriva-ink hover:text-moriva-teal">
                      {r.providerService.serviceName}
                    </Link>
                    <StatusBadge tone={r.state === "PENDING_PROVIDER_ACKNOWLEDGEMENT" ? "warning" : "teal"}>{r.state === "PENDING_PROVIDER_ACKNOWLEDGEMENT" ? "Awaiting acknowledgement" : r.state.replace(/_/g, " ").toLowerCase()}</StatusBadge>
                  </div>
                  {r.providerService.provider.demoData && <p className="mt-0.5 text-[11px] font-semibold text-[#B45A3F]">SIMULATED PROVIDER</p>}
                </li>
              ))}
            </ul>
          )}
          <Link href="/app/referrals" className="mt-3 inline-block text-sm font-semibold text-moriva-teal underline-offset-4 hover:underline">
            All referrals →
          </Link>
        </article>

        <article className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-moriva-slate">Your privacy</h2>
          <p className="mt-2 text-sm text-moriva-slate">
            {consents} active permission{consents === 1 ? "" : "s"}. You decide who sees what — review or withdraw any time.
          </p>
          <Link href="/app/privacy" className="mt-3 inline-block min-h-11 rounded-lg border border-moriva-teal px-4 py-2 text-sm font-semibold leading-6 text-moriva-teal hover:bg-secondary">
            Privacy centre
          </Link>
          <Link href="/help-now" className="mt-3 ml-2 inline-block min-h-11 rounded-lg bg-state-critical px-4 py-2 text-sm font-bold leading-6 text-white hover:opacity-90">
            Help now
          </Link>
        </article>
      </div>

      <div className="mt-6">
        <IndividualOverviewActions />
      </div>

      <section className="mt-6 rounded-2xl border border-moriva-line bg-white p-5">
        <h2 className="font-display text-base font-bold text-moriva-ink">How the loop works</h2>
        <ol className="mt-2 grid gap-2 text-sm text-moriva-slate md:grid-cols-5">
          {["Notice — check in privately", "Understand — screening, not diagnosis", "Choose — options with reasons", "Connect — consented referral", "Follow up — see what happened"].map((s, i) => (
            <li key={s} className="rounded-lg bg-muted px-3 py-2">
              <span className="mr-1 font-bold text-moriva-teal">{i + 1}.</span>{s}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

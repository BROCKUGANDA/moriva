"use client";

import Link from "next/link";
import { MorivaMark } from "@/components/moriva/brand";
import { useLocale } from "@/components/moriva/locale-provider";

export function LandingHero() {
  const { t } = useLocale();
  return (
    <section className="moriva-gradient-primary relative overflow-hidden text-white">
      <div className="moriva-container relative grid gap-10 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moriva-mist">{t.appName}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-balance md:text-5xl">
            {t.landing.headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{t.landing.sub}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 py-3 text-base font-bold text-moriva-ink shadow-card hover:bg-moriva-pearl"
              data-testid="cta-explore-support"
            >
              {t.landing.ctaPrimary}
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-12 items-center rounded-xl border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10"
            >
              {t.landing.ctaSecondary}
            </Link>
          </div>
          <p className="mt-6 max-w-xl text-sm text-white/75">{t.landing.boundary}</p>
        </div>
        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-sm">
            <div className="flex justify-center">
              <MorivaMark className="h-44 w-44 opacity-95" />
            </div>
            <div className="mt-6 space-y-3">
              {[
                { n: 1, label: t.landing.step1Title },
                { n: 2, label: t.landing.step2Title },
                { n: 3, label: t.landing.step3Title },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moriva-coral text-sm font-bold text-moriva-ink">
                    {s.n}
                  </span>
                  <span className="font-display text-base font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* three-step strip for mobile */}
      <div className="moriva-container grid grid-cols-3 gap-2 pb-10 lg:hidden" aria-hidden="true">
        {[t.landing.step1Title, t.landing.step2Title, t.landing.step3Title].map((label, i) => (
          <div key={label} className="rounded-xl bg-white/10 px-3 py-2 text-center">
            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-moriva-coral text-xs font-bold text-moriva-ink">{i + 1}</span>
            <p className="mt-1 text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

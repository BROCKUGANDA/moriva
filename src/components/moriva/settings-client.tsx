"use client";

import { useState } from "react";
import { useLocale } from "@/components/moriva/locale-provider";
import { InlineNotice } from "@/components/moriva/status";
import { Button } from "@/components/ui/button";

export function SettingsClient({ email, displayName }: { email: string; displayName: string }) {
  const { locale, setLocale, t } = useLocale();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function toggleMotion() {
    setReducedMotion(!reducedMotion);
    document.documentElement.classList.toggle("moriva-force-reduced", !reducedMotion);
    setNotice(reducedMotion ? "Standard motion restored." : "Motion reduced for this session.");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-moriva-ink">Language</h2>
        <p className="mt-1 text-sm text-moriva-slate">The interface language. Arabic is a shell preview pending professional translation review — questionnaire content stays English.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant={locale === "en" ? "default" : "outline"} onClick={() => setLocale("en")} className="min-h-11">English</Button>
          <Button variant={locale === "ar" ? "default" : "outline"} onClick={() => setLocale("ar")} className="min-h-11" data-testid="lang-ar">
            العربية
          </Button>
        </div>
        <p className="mt-2 text-xs text-moriva-slate">{t.common.arabic}</p>
      </section>

      <section className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-moriva-ink">Accessibility</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-moriva-ink">Reduce motion</p>
            <p className="text-xs text-moriva-slate">System preference is respected automatically; you can also force it here.</p>
          </div>
          <Button variant="outline" onClick={toggleMotion} className="min-h-11">{reducedMotion ? "Motion on" : "Motion off"}</Button>
        </div>
        {notice && <InlineNotice kind="success" className="mt-3">{notice}</InlineNotice>}
      </section>

      <section className="rounded-2xl border border-moriva-line bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-bold text-moriva-ink">Account</h2>
        <dl className="mt-2 text-sm">
          <div className="flex justify-between border-b border-moriva-line py-2"><dt className="text-moriva-slate">Display name</dt><dd className="font-medium">{displayName}</dd></div>
          <div className="flex justify-between border-b border-moriva-line py-2"><dt className="text-moriva-slate">Email</dt><dd className="font-medium">{email}</dd></div>
          <div className="flex justify-between py-2"><dt className="text-moriva-slate">Region</dt><dd className="font-medium">Abu Dhabi, UAE (AE-AZ)</dd></div>
        </dl>
        <p className="mt-2 text-xs text-moriva-slate">Email and name changes are not available in this prototype. Export or deletion requests live in the privacy centre.</p>
      </section>
    </div>
  );
}

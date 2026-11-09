"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MorivaLogo } from "@/components/moriva/brand";
import { useLocale } from "@/components/moriva/locale-provider";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Menu, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/how-it-works", label: t.nav.howItWorks },
    { href: "/our-approach", label: t.nav.ourApproach },
    { href: "/providers", label: t.nav.providers },
    { href: "/privacy", label: t.nav.privacy },
    { href: "/safety", label: t.nav.safety },
    { href: "/about", label: t.nav.about },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-moriva-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="moriva-container flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="MORIVA home" className="shrink-0">
          <MorivaLogo withTagline />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-moriva-slate hover:bg-secondary hover:text-moriva-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/help-now"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-state-critical/40 bg-[#FAEBEC] px-3 py-2 text-sm font-bold text-state-critical hover:bg-[#f5dde0]"
          >
            <LifeBuoy aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">{t.nav.helpNow}</span>
          </Link>
          <Link href="/login" className="hidden min-h-11 items-center rounded-lg bg-moriva-teal px-4 py-2 text-sm font-semibold text-white hover:bg-moriva-teal-soft sm:inline-flex">
            {t.nav.signIn}
          </Link>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-moriva-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-moriva-line bg-white lg:hidden">
          <div className="moriva-container flex flex-col py-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-moriva-ink hover:bg-secondary">
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="mx-3 my-2 rounded-lg bg-moriva-teal px-4 py-3 text-center text-base font-semibold text-white">
              {t.nav.signIn}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function PublicFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-auto border-t border-moriva-line bg-white">
      <div className="moriva-container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <MorivaLogo withTagline />
            <p className="moriva-reading mt-3 text-sm text-moriva-slate">{t.landing.boundary}</p>
            <a
              href="tel:999"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-state-critical px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <Phone aria-hidden className="h-4 w-4" /> 999 · {t.safety.nearestEd}
            </a>
          </div>
          <nav aria-label="Product" className="flex flex-col gap-2 text-sm">
            <p className="font-semibold text-moriva-ink">Product</p>
            <Link href="/how-it-works" className="text-moriva-slate hover:text-moriva-teal">How it works</Link>
            <Link href="/our-approach" className="text-moriva-slate hover:text-moriva-teal">Our approach</Link>
            <Link href="/providers" className="text-moriva-slate hover:text-moriva-teal">Providers</Link>
            <Link href="/accessibility" className="text-moriva-slate hover:text-moriva-teal">Accessibility</Link>
          </nav>
          <nav aria-label="Trust" className="flex flex-col gap-2 text-sm">
            <p className="font-semibold text-moriva-ink">Trust</p>
            <Link href="/privacy" className="text-moriva-slate hover:text-moriva-teal">Privacy</Link>
            <Link href="/safety" className="text-moriva-slate hover:text-moriva-teal">Safety</Link>
            <Link href="/legal/terms" className="text-moriva-slate hover:text-moriva-teal">Terms</Link>
            <Link href="/legal/health-disclaimer" className="text-moriva-slate hover:text-moriva-teal">Health disclaimer</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-moriva-line pt-4 text-xs text-moriva-slate">
          <p>Prototype for the Future Health Digital Innovation Challenge 2026. Not a licensed healthcare provider, medical device or emergency service. All data shown is synthetic.</p>
          <p className="mt-1">© 2026 MORIVA (working brand, not a cleared trademark).</p>
        </div>
      </div>
    </footer>
  );
}

export function HelpNowEntry({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <Link
      href="/help-now"
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg bg-state-critical px-3 py-2 text-sm font-bold text-white hover:opacity-90",
        className
      )}
      data-testid="help-now-entry"
    >
      <LifeBuoy aria-hidden className="h-4 w-4" />
      {t.nav.helpNow}
    </Link>
  );
}

export function IndividualTopNav({ user }: { user: { displayName: string; role: string } }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const links = [
    { href: "/app", label: t.nav.dashboard },
    { href: "/app/assessments", label: t.nav.assessments },
    { href: "/app/support", label: t.nav.support },
    { href: "/app/referrals", label: t.nav.referrals },
    { href: "/app/privacy", label: t.nav.privacy },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-moriva-line bg-white/95 backdrop-blur">
      <div className="moriva-container flex h-16 items-center justify-between gap-3">
        <Link href="/app" aria-label="MORIVA app home">
          <MorivaLogo />
        </Link>
        <nav aria-label="Application" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                pathname === l.href ? "bg-secondary text-moriva-teal" : "text-moriva-slate hover:bg-secondary hover:text-moriva-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-moriva-slate md:inline">{user.displayName}</span>
          <HelpNowEntry />
          <SignOutButton label={t.nav.signOut} />
        </div>
      </div>
    </header>
  );
}

export function IndividualBottomNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  const items = [
    { href: "/app", label: t.nav.dashboard, icon: "M4 6h16M4 12h16M4 18h10" },
    { href: "/app/assessments", label: t.nav.assessments, icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" },
    { href: "/app/check-in", label: t.nav.checkin, icon: "M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
    { href: "/app/support", label: t.nav.support, icon: "M12 21s-7-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.4-9 9-9 9Z" },
    { href: "/app/referrals", label: t.nav.referrals, icon: "M4 12h12m0 0-4-4m4 4-4 4M20 4v16" },
    { href: "/app/privacy", label: t.nav.profile, icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" },
  ];
  return (
    <nav aria-label="Primary (mobile)" className="sticky bottom-0 z-50 border-t border-moriva-line bg-white md:hidden">
      <div className="grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={pathname === i.href ? "page" : undefined}
            className={cn(
              "flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium",
              pathname === i.href ? "text-moriva-teal" : "text-moriva-slate"
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5" aria-hidden>
              <path d={i.icon} />
            </svg>
            {i.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function SignOutButton({ label }: { label: string }) {
  const { t } = useLocale();
  const router = useRouter();
  async function signOut() {
    const csrf = document.cookie.split("; ").find((c) => c.startsWith("moriva_csrf="))?.split("=")[1] ?? "";
    await fetch("/api/v1/auth/logout", { method: "POST", headers: { "x-csrf-token": csrf } });
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={signOut} className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-moriva-slate hover:bg-secondary">
      {label ?? t.nav.signOut}
    </button>
  );
}

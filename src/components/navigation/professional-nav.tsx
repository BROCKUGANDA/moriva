"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MorivaLogo } from "@/components/moriva/brand";
import { SignOutButton } from "@/components/navigation/shells";
import { ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProfessionalNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/professional/inbox", label: "Inbox" },
    { href: "/professional/follow-ups", label: "Follow-ups" },
    { href: "/professional/audit", label: "My audit trail" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-moriva-line bg-white">
      <div className="moriva-container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/professional/inbox" aria-label="Professional workspace home"><MorivaLogo /></Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF3E4] px-2.5 py-1 text-xs font-bold text-state-warning">
            <ShieldQuestion aria-hidden className="h-3.5 w-3.5" /> SIMULATED
          </span>
        </div>
        <nav aria-label="Professional" className="hidden items-center gap-1 md:flex">
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
        <nav aria-label="Professional (mobile)" className="flex items-center gap-1 overflow-x-auto md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
                pathname === l.href ? "bg-secondary text-moriva-teal" : "text-moriva-slate hover:bg-secondary hover:text-moriva-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-moriva-slate md:inline">{displayName}</span>
          <SignOutButton label="Sign out" />
        </div>
      </div>
    </header>
  );
}

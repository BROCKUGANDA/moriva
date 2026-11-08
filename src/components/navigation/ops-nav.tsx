"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MorivaLogo } from "@/components/moriva/brand";
import { SignOutButton } from "@/components/navigation/shells";
import { cn } from "@/lib/utils";

export function OpsNav({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/ops/overview", label: "Overview" },
    { href: "/ops/providers", label: "Providers" },
    { href: "/ops/instruments", label: "Instruments" },
    { href: "/ops/pathways", label: "Pathways" },
    { href: "/ops/escalation-config", label: "Escalation config" },
    { href: "/ops/outcomes", label: "Outcomes" },
    { href: "/ops/audit", label: "Audit" },
    { href: "/ops/system", label: "System" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-moriva-line bg-white">
      <div className="moriva-container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/ops/overview" aria-label="Operations home"><MorivaLogo /></Link>
          <span className="rounded-full bg-moriva-ink px-2.5 py-1 text-xs font-bold text-white">OPS · SIMULATED</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-moriva-slate md:inline">{displayName}</span>
          <SignOutButton label="Sign out" />
        </div>
      </div>
      <nav aria-label="Operations" className="moriva-container flex gap-1 overflow-x-auto pb-2">
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
    </header>
  );
}

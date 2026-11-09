"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldQuestion, Info, CheckCircle2, XCircle } from "lucide-react";

/**
 * Status/notice components. Text + icon always accompany colour (AC-UX-07).
 */

export function DemoBanner({ label = "DEMO ENVIRONMENT — SYNTHETIC DATA ONLY" }: { label?: string }) {
  return (
    <div
      role="note"
      aria-label="Environment notice"
      className="w-full bg-moriva-ink px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white"
    >
      {label}
    </div>
  );
}

export function SimulationBanner({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      aria-label="Simulation notice"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-state-warning/40 bg-[#FBF3E4] px-3 py-2 text-state-warning",
        className
      )}
    >
      <ShieldQuestion aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
        <span className="font-bold">SIMULATION</span> — This workspace is a prototype demonstration. No licensed
        professional or real provider is acting on this data.
      </p>
    </div>
  );
}

export function InlineNotice({
  kind = "info",
  title,
  children,
  className,
  role,
}: {
  kind?: "info" | "warning" | "success" | "critical";
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: "alert" | "status" | "note";
}) {
  const map = {
    info: { cls: "border-moriva-teal/30 bg-[#E7F3EF] text-moriva-ink", Icon: Info },
    warning: { cls: "border-state-warning/40 bg-[#FBF3E4] text-state-warning", Icon: AlertTriangle },
    success: { cls: "border-state-success/30 bg-[#E9F4EE] text-state-success", Icon: CheckCircle2 },
    critical: { cls: "border-state-critical/40 bg-[#FAEBEC] text-state-critical", Icon: XCircle },
  } as const;
  const { cls, Icon } = map[kind];
  const roleAttr = role ?? (kind === "critical" ? "alert" : "status");
  return (
    <div role={roleAttr} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2", cls, className)}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[13px] leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-muted text-moriva-slate border-moriva-line",
  teal: "bg-secondary text-moriva-teal border-moriva-teal/30",
  success: "bg-[#E9F4EE] text-state-success border-state-success/30",
  warning: "bg-[#FBF3E4] text-state-warning border-state-warning/40",
  critical: "bg-[#FAEBEC] text-state-critical border-state-critical/40",
  coral: "bg-[#FDEEE9] text-[#B45A3F] border-[#F29B83]/50",
} as const;

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  icon,
}: {
  tone?: keyof typeof BADGE_TONES;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        BADGE_TONES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function VerificationBadge({
  status,
  demoData,
  lastVerifiedLabel,
}: {
  status: string;
  demoData?: boolean;
  lastVerifiedLabel?: string;
}) {
  const tone =
    status === "VERIFIED" ? "success"
    : status === "DEMO_VERIFIED_SIMULATED" ? "coral"
    : status === "PENDING" ? "warning"
    : "critical";
  const label =
    status === "DEMO_VERIFIED_SIMULATED" ? "SIMULATED LISTING"
    : status === "VERIFIED" ? "Verified"
    : status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <StatusBadge tone={tone as keyof typeof BADGE_TONES} icon={<Info aria-hidden className="h-3 w-3" />}>
      {label}
      {demoData && status !== "DEMO_VERIFIED_SIMULATED" ? " · demo" : ""}
      {lastVerifiedLabel ? ` · ${lastVerifiedLabel}` : ""}
    </StatusBadge>
  );
}

export function EmptyState({
  title,
  children,
  action,
  icon,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-moriva-line bg-white/60 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-moriva-teal">{icon}</div>}
      <p className="font-display text-lg font-semibold text-moriva-ink">{title}</p>
      {children && <div className="moriva-reading mt-1 text-sm text-moriva-slate">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, message, retry }: { title: string; message?: string; retry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-state-critical/30 bg-[#FAEBEC] px-6 py-8 text-center">
      <p className="font-display text-lg font-semibold text-state-critical">{title}</p>
      {message && <p className="moriva-reading mx-auto mt-1 text-sm text-moriva-ink/80">{message}</p>}
      {retry && (
        <button onClick={retry} className="mt-4 rounded-lg border border-state-critical/40 px-4 py-2 text-sm font-semibold text-state-critical hover:bg-white">
          Try again
        </button>
      )}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  id,
  level = 2,
  className,
}: {
  title: string;
  description?: string;
  id?: string;
  level?: 1 | 2 | 3;
  className?: string;
}) {
  const Tag = (`h${level}` as "h1" | "h2" | "h3");
  return (
    <div className={cn("mb-4", className)}>
      <Tag id={id} className={cn("font-display font-bold text-moriva-ink", level === 1 ? "text-3xl md:text-4xl" : level === 2 ? "text-2xl" : "text-lg")}>
        {title}
      </Tag>
      {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-moriva-slate md:text-base">{description}</p>}
    </div>
  );
}

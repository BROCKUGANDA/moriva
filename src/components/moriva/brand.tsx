import { cn } from "@/lib/utils";

/**
 * MORIVA brand components — faithful React renderings of the supplied SVG masters
 * (public/brand/*.svg). The mark: open protective orbit + crossing path + coral signal point.
 * Per brand rules: never stretch/skew/rotate, keep clear space, no medical additions.
 */

export function MorivaMark({ className, titleLevel = 2 }: { className?: string; titleLevel?: 1 | 2 }) {
  const TitleTag = titleLevel === 1 ? "title" : "title";
  return (
    <svg
      viewBox="0 0 128 128"
      role="img"
      aria-labelledby="moriva-mark-title"
      className={cn("h-10 w-10", className)}
      focusable="false"
    >
      <title id="moriva-mark-title">MORIVA symbol</title>
      <desc id="moriva-mark-desc">
        A flowing, open circular path around a central signal point, representing early recognition and a connected
        route to support.
      </desc>
      <defs>
        <linearGradient id="morivaFlow" x1="20" y1="25" x2="105" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#197F7B" />
          <stop offset="1" stopColor="#A8D5CD" />
        </linearGradient>
      </defs>
      <path d="M29 87C15 72 14 49 25 31C33 18 46 11 59 10" fill="none" stroke="#122C38" strokeWidth="8" strokeLinecap="round" />
      <path d="M69 10C83 11 96 19 104 32C115 50 112 73 98 88" fill="none" stroke="#197F7B" strokeWidth="8" strokeLinecap="round" />
      <path d="M25 67C39 70 47 61 57 49C67 37 79 34 99 43" fill="none" stroke="url(#morivaFlow)" strokeWidth="9" strokeLinecap="round" />
      <path d="M29 91C48 108 79 109 99 90" fill="none" stroke="#A8D5CD" strokeWidth="9" strokeLinecap="round" />
      <circle cx="64" cy="25" r="8" fill="#F29B83" />
    </svg>
  );
}

export function MorivaWordmark({ className }: { className?: string }) {
  return <span className={cn("font-display font-extrabold tracking-wide text-moriva-ink", className)}>MORIVA</span>;
}

export function MorivaLogo({
  variant = "default",
  className,
  withTagline = false,
}: {
  variant?: "default" | "reversed";
  className?: string;
  withTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <MorivaMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-[0.18em]",
            variant === "reversed" ? "text-white" : "text-moriva-ink"
          )}
        >
          MORIVA
        </span>
        {withTagline && (
          <span
            className={cn(
              "mt-1 text-[10px] font-semibold tracking-[0.14em]",
              variant === "reversed" ? "text-moriva-mist" : "text-moriva-teal"
            )}
          >
            NOTICE EARLIER. FIND THE RIGHT SUPPORT.
          </span>
        )}
      </span>
    </span>
  );
}

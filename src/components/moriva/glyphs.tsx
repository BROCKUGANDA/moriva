import { cn } from "@/lib/utils";

/**
 * MORIVA custom glyph set (BRAND_GUIDELINES.md §Iconography):
 * signal, pathway, handoff, consent-key, care-context, follow-through.
 * Consistent 1.75 stroke feel, rounded caps, no medical symbols.
 */

type GlyphProps = { className?: string; "aria-hidden"?: boolean };

export function GlyphSignal({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={cn("h-5 w-5", className)} {...rest}>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9" />
      <path d="M16.5 7.5a6.4 6.4 0 0 1 0 9" />
    </svg>
  );
}

export function GlyphPathway({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={cn("h-5 w-5", className)} {...rest}>
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="5" r="2" />
      <path d="M7 17c4-1 5-4 4.5-6.5C11 8 13 6.5 17 7" />
    </svg>
  );
}

export function GlyphHandoff({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={cn("h-5 w-5", className)} {...rest}>
      <path d="M4 15a8 8 0 0 1 8-8" />
      <path d="M20 9a8 8 0 0 1-8 8" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GlyphConsentKey({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={cn("h-5 w-5", className)} {...rest}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M12 11.5V15.5" />
      <path d="M9.5 15.5h5" />
    </svg>
  );
}

export function GlyphCareContext({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={cn("h-5 w-5", className)} {...rest}>
      <rect x="3" y="6" width="7.5" height="12" rx="2.5" />
      <rect x="13.5" y="6" width="7.5" height="12" rx="2.5" />
      <path d="M10.5 12h3" />
    </svg>
  );
}

export function GlyphFollowThrough({ className, ...rest }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className={cn("h-5 w-5", className)} {...rest}>
      <path d="M4 18c3.5 0 5-2.5 5-6s1.5-6 5-6" />
      <circle cx="17.5" cy="6" r="2" />
      <path d="M19.2 7.6L21 9.4" />
      <path d="M20 6l1.4-1.4" opacity="0" />
    </svg>
  );
}

export const GLYPHS = {
  signal: GlyphSignal,
  pathway: GlyphPathway,
  handoff: GlyphHandoff,
  "consent-key": GlyphConsentKey,
  "care-context": GlyphCareContext,
  "follow-through": GlyphFollowThrough,
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function Glyph({ name, className }: { name: GlyphName; className?: string }) {
  const C = GLYPHS[name];
  return <C className={className} aria-hidden />;
}

# MORIVA Brand System

**Status:** Working identity for the Future Health Digital Innovation Challenge. Not a cleared trademark or approved legal entity name.

## Brand idea

**MORIVA** is a coined working name for a human-centred early-wellbeing and care-navigation platform. The brand promise is: **Notice earlier. Find the right support.** MORIVA should feel calm without being sleepy, clinically responsible without feeling institutional, and technologically capable without making AI the hero.

The product is not an AI therapist, diagnostic system, emergency service, or replacement for a clinician. The identity should communicate a guided route to trusted human support.

## Name note

A preliminary public-web exact-name screen was performed while preparing the concept. It did not establish legal availability. Search-engine absence is not evidence of trademark clearance. Before public launch, obtain professional clearance for MORIVA and relevant variants in the UAE and all intended markets, including word mark, logo mark, company name, domains, app stores, and relevant Nice classes. Do not invest in irreversible packaging, incorporation, or paid campaigns before clearance.

## Logo concept

The mark uses an open, protective orbit with a continuous crossing path and a small coral signal point. It communicates three ideas:

1. **Notice:** the coral node is a small signal worth paying attention to.
2. **Navigate:** the crossing path suggests a route, not an automated clinical decision.
3. **Connect:** the open orbit suggests a support network with a deliberate human opening.

Avoid describing the mark as a medical symbol. It is a brand metaphor, not a clinical badge.

### Master assets

- `moriva-logo-primary.svg`: primary wordmark and descriptor, editable vector master.
- `moriva-mark.svg`: symbol-only editable master.
- `moriva-logo-reversed.svg`: white version for dark surfaces.
- `favicon.svg`: app/favicon tile.
- `moriva-generated-mark-concept.png`: generated visual concept used as creative reference; not the authoritative vector master.

### Clear-space and sizing

- Maintain clear space of at least the height of the coral signal dot on every side.
- Primary wordmark minimum width: 160 CSS px on web, 32 mm in print.
- Symbol-only minimum size: 24 CSS px; below 24 px use a simplified single-colour favicon.
- Do not stretch, skew, rotate, add a medical cross, add glow, put text inside the mark, or change the relative position of the signal point.
- Use the reversed mark only on `Deep Current` or similarly dark, high-contrast surfaces.

## Palette

| Token | Hex | Role |
|---|---:|---|
| Deep Current | `#122C38` | Primary ink, navigation, headings, high-contrast shell |
| Tidal Teal | `#197F7B` | Primary action, progress, navigation highlights |
| Soft Current | `#2F9B96` | Secondary interactive state |
| Mist | `#A8D5CD` | Soft surfaces, charts, supportive backgrounds |
| Signal Coral | `#F29B83` | Small attention cue, never a crisis/warning colour |
| Pearl | `#F7F6F1` | Main warm canvas |
| White | `#FFFFFF` | Cards and input surfaces |
| Slate | `#53666D` | Secondary text |
| Line | `#DCE5E1` | Borders and dividers |
| Calm Green | `#2F7A5C` | Success only |
| Amber | `#A96818` | Warning only |
| Critical | `#B33C45` | Urgent / destructive / high-risk state only |

Coral is an identity accent. It must never be used as the only warning cue. Critical-risk interfaces use accessible critical red plus plain-language text and iconography.

## Typography

- Display and brand headings: **Manrope**, weights 600–750.
- UI and long-form text: **Inter**, weights 400–700.
- Arabic: a tested Arabic UI family such as **Noto Sans Arabic** or an approved system fallback. Test line height, punctuation, numerals, mixed LTR/RTL and screen-reader reading order with actual Arabic content.
- Use fluid but bounded sizing: display 40–56 px desktop / 32–40 px mobile; H1 32/38; H2 24/32; H3 20/28; body 16/24; supporting 14/20; metadata 12/16.
- Avoid all-caps paragraphs, thin weights, long line lengths, and dense 12 px body copy.

## Gradients

- Primary atmospheric gradient: `linear-gradient(125deg, #122C38 0%, #197F7B 62%, #2F9B96 100%)`.
- Soft wellbeing surface: `linear-gradient(135deg, #E7F3EF 0%, #F7F6F1 100%)`.
- Coral signal glow: do not use as a large page gradient; use a small radial wash only for optional onboarding illustration.
- Gradients are decorative; all text must remain readable against measured contrast. Never use a gradient to encode assessment severity or clinical risk.

## Shape and layout

- 8 px base spacing scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80.
- Cards: 16 px radius; modal/drawer: 20 px; input: 12 px; pill: fully rounded only for tags and segmented controls.
- Page max width: 1280 px; reading width: 720 px; assessment question width: 760 px.
- Use clear grid, generous breathing room, strong hierarchy and persistent access to Help.
- Shadows are subtle: 0 8px 28px rgba(18,44,56,0.06). Do not use glassmorphism over text or health data.

## Iconography and glyphs

Use Lucide icons as a base, with consistent 1.75 px stroke, 20/24 px sizes and rounded caps. Create a small custom MORIVA glyph set for product-specific concepts:

- `signal`: a small point with two expanding arcs; early change.
- `pathway`: a curved route passing through two nodes; support navigation.
- `handoff`: two joined open arcs; human handoff.
- `consent-key`: keyhole inside an open ring; permission.
- `care-context`: two adjacent rounded panels joined by a thin bridge; physical/mental context.
- `follow-through`: a route ending in a confirmed node; completed follow-up.

Do not use brain scans, heartbeat/EKG lines, pills, medical crosses, or a heart as the primary brand mark. Use an appropriate clinical icon only when describing a genuine clinical service.

## Voice and writing

- Warm, precise, direct and non-judgmental.
- Say “your responses suggest…” rather than “you have…”.
- Say “screening result” rather than “diagnosis”.
- Say “support option” rather than “treatment recommendation” unless a clinician authored it.
- Explain data sharing before the user confirms it.
- Never promise confidentiality beyond the actual system boundary.
- Never use guilt, streaks, urgency dark patterns, or gamified mental-health scores.

## Motion

- Standard transitions 160–220 ms; modal 180–240 ms; route changes 180 ms opacity/translate only.
- Respect `prefers-reduced-motion` and provide no-motion mode.
- No animated score counters, bouncing alert badges, pulsing crisis alerts, or attention-grabbing infinite loops.
- Progress is calm and explicit. Avoid long blocking animations.

## Accessibility

Target WCAG 2.2 AA. Maintain visible keyboard focus, semantic structure, target sizes, text resizing, high contrast, accessible error summaries, reduced-motion support and screen-reader announcements. Do not rely on colour alone. Validate in both English LTR and Arabic RTL.

## Do / do not

**Do:** use calm surfaces, clear language, consistent line icons, thoughtful whitespace, explicit next steps, obvious consent controls, and a persistent help route.

**Do not:** make the interface look like a social network, add leaderboards, display public wellbeing scores, use employer dashboards containing individual details, use medical-looking AI avatars, or bury safety/privacy information in legal footers.

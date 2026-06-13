# Design — MUMBAAI

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Provenance

DNA adapted from a Refero design-system extraction of `dala.craftedbygc.com`
("particle cosmos on a void"), supplied by the owner as the chosen reference on
2026-06-12. We adopt the **system** — void canvas, single voltage accent, thin
tracked display type, pill geometry, hairline borders, particle constellation as
brand imagery — and write Mumba's own copy, formations, scenes, and components.
We do not reproduce the source's artwork, copy, or typeface. Tokens below are
the Mumba adaptation, not a verbatim copy.

**Second reference (2026-06-12, partially adopted then narrowed):** a Refero
extraction of `adaline.ai`. Only its *structural pattern* survives — the
product demo video rising into the foreground over an atmospheric backdrop.
Its landscape imagery and earth/sage colors were dropped at the owner's
request on the same day; the backdrop is pure void with sparse constellation
drift, strictly the Dala-DNA palette.

## Genre

atmospheric (marketing) · modern-minimal discipline (app chrome)

## Story

The brand narrative is **the brain story**, told by one continuous particle
field on the landing hero, scrubbed by native scroll:

1. **Brain** — particles assemble into a mind. "Your mind doesn't think in a straight line."
2. **Line** — the brain compresses into one flat row. "Every AI chat forces it through one."
3. **Fork** — the line branches into parallel streams. "Branch any reply. Explore in parallel."
4. **Map** — pull back: a synaptic constellation — the Mumba canvas.
5. **Pulse** — pathways converge into one plum flash. Smart Merge.
6. **Brain, again** — the field settles back into the brain, organized and lit.
   "A conversation shaped like your mind." → Start free.

After the story, the real demo video rises into the foreground over a sparse
constellation drift on the void as you scroll — atmosphere in back, product
in front. The hero is interactive: an intro burst assembles the brain on
load, scroll progress is damped (never 1:1 with the wheel), and particles
part gently around the cursor.

Display headlines are short Title Case statements at 52–113px, weight 200,
line-height ≤0.96. Scene copy after the fold is centered under the formation,
never tucked in a corner.

## Macrostructure family

- Marketing pages: Marquee Hero (the scroll-story owns the fold; sections below
  are sparse text blocks floating on the void, no card panels). Nav: fixed bar,
  wordmark left, links right, single plum pill CTA. Footer: Ft2 inline single line.
- App pages: Workbench — the ReactFlow canvas is the page; chrome recedes to
  hairline-bordered panels on the void.
- Content/admin pages: Long Document discipline — narrow measure, type-led.

## Theme — tokens (dark is primary; the system IS dark)

| Token | Value | Role |
| --- | --- | --- |
| `--color-void` | `#000000` | Page background, canvas. Everything sits on it. |
| `--color-panel` | `#0A0A0B` | App allowance only: chat panel / node surface (chat readability needs one elevation step; landing never uses it). |
| `--color-bone` | `#FFFFFF` | Primary text, icon strokes. |
| `--color-ash` | `#BDBDBD` | Secondary text. |
| `--color-smoke` | `#9A9A9A` | Tertiary text, resting nav links. |
| `--color-hairline` | `rgba(255,255,255,0.10)` | Borders, dividers, card outlines. |
| `--color-hairline-strong` | `rgba(255,255,255,0.22)` | Hover borders, input focus borders. |
| `--color-plum` | `#8052FF` | THE accent. Only filled chromatic surface: primary CTA, selection, streaming edge, merge pulse, focus ring. |
| `--color-plum-hover` | `#9066FF` | Hover state of plum fills. |
| `--color-plum-soft` | `rgba(128,82,255,0.14)` | Selected-node tint, plum-tinted chips. |
| `--color-amber` | `#FFB829` | Outlined emphasis + constellation only. NEVER a filled CTA. |
| `--color-lichen` | `#15846E` | Constellation/decorative marks only. Never interface chrome. |
| `--color-danger` | `#F0594E` | Destructive actions only (delete). Text/outline, not floods. |

Light variant (app opt-in later, `[data-theme="light"]`): paper `#FAFAF8`,
panel `#FFFFFF`, ink `#101012`, ash→`#55534F`, smoke→`#7A776F`, hairline
`rgba(0,0,0,0.10)`, plum unchanged. Marketing pages are always dark.

## Typography

- Single family: **Inter Variable** (substitute for the reference's Acronym; its
  listed fallback). `--font-sans: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif`.
- Weights: 200 (display only), 400 (body), 600 (nav/buttons/labels), 700 (rare emphasis).
- Display is weight 200 at extreme size with `-0.04em` tracking — "etched in
  light". Never bold the hero.
- Body 15–18px, weight 400, `+0.015em` tracking, line-height 1.5, measure ≤ 60ch.
- Eyebrow/kicker: 12–13px, weight 600, uppercase, `+0.05em` tracking, bone or plum.
- Scale (px): 12 caption · 14 body-sm · 15 base · 18 subheading · 24 heading-sm ·
  36 heading · 48 heading-lg · display `clamp(56px, 9vw, 96px)` ·
  hero `clamp(64px, 11vw, 120px)`. Negative tracking only ≥ 48px.
- App UI sizes: 13 controls · 14 body · 15 chat text.

## Spacing

6px base unit: 6 · 12 · 18 · 24 · 30 · 36 · 60 · 96 · 120. Section gap 96–120px
on marketing (let the void breathe), 60px minimum. Page max-width 1200px.

## Radii

- Buttons + nav pill + chips: 24px (pill geometry is the system).
- Landing cards (rare): 24px, hairline border, no fill.
- App allowance: nodes/panels/inputs 16px; tiny controls 8px. Never < 8px.

## Elevation

None. No shadows, no glows, no gradients, no glassmorphism, no textures. Depth
comes from the void, hairlines, and type weight. A "card" is a hairline border
on black. (App allowance: `--color-panel` is the single permitted surface step.)

## Motion

- Easings: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`; `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`. Never default `ease`, never bounce.
- Durations: `--dur-fast: 120ms` (hover/press) · `--dur-med: 200ms` (panels) · `--dur-slow: 320ms` (scene copy).
- Animate `transform` and `opacity` only.
- The particle field is the only cinematic element. UI motion is silent.
- Streaming: plum dash flowing on the active edge + caret pulse. No whole-card pulsing.
- `prefers-reduced-motion: reduce` → particle field renders the final brain as a
  static poster; all transitions collapse to ≤150ms opacity.

## Microinteractions stance

- Silent success; no celebratory toasts.
- Optimistic update + Undo over confirm dialogs (destructive delete still confirms).
- `:focus-visible`: 2px plum ring at 2px offset, instant, never animated.
- Hover tooltips delay 800ms; focus tooltips 0ms.

## CTA voice

- Primary: plum fill, bone text, pill (24px), 12–13px weight 600 uppercase
  `+0.05em` tracking, padding 14px 22px. Exactly one plum fill per viewport.
- Secondary: hairline outline pill, bone text, same metrics. Hover: border
  brightens to `--color-hairline-strong`. No second filled color, ever.
- Copy: verbs, sentence-honest. "Start free", "Watch the demo", "Open the canvas".

## Canvas (ReactFlow) semantics

- Node: `--color-panel` surface, hairline border, 16px radius.
- Role is carried by avatar glyph + label, not by fill color.
- Selected: plum border + `--color-plum-soft` tint. Multi-select (merge set):
  plum border + count badge; NEVER red.
- Merged node: plum hairline + merge glyph; merge pulse on creation (one 320ms
  scale+fade, then still).
- Edges: `rgba(255,255,255,0.18)`; streaming edge: plum animated dash; selected
  edge: plum.
- Canvas background: void with 1px dot grid at `rgba(255,255,255,0.05)`.
- Branch affordance: visible "+ branch" handle on node hover/selection.

## What pages MUST share

Wordmark; plum as the only action color; Inter Variable; pill CTA voice;
hairline border language; the void.

## What pages MAY differ on

Marketing may use the particle constellation (Tier-A/B, hand-built); app pages
MUST NOT — function carries them. Admin pages: typography only.

## Do / Don't (inherited from the DNA, enforced)

- Do let the constellation own ≥50% of hero real estate; text is a guest.
- Do use negative tracking only ≥48px; positive tracking at body sizes.
- Don't add a second filled chromatic button. Amber is outline-only.
- Don't use shadows/gradients/glassmorphism/emoji-as-icons anywhere.
- Don't put plum text on bone, or bone text on amber. Invert only.
- Don't fill empty space with decoration; the void is the design.

## Exports

### tokens.css
See `src/styles/tokens.css` — the canonical token file consumed by the app.

### Tailwind (v3 `theme.extend`)
See `tailwind.config.js` — mirrors tokens.css (void, panel, bone, ash, smoke,
plum, amber, lichen, hairline; spacing 6-base additions; radius pill/node;
tracking display/body/kicker).

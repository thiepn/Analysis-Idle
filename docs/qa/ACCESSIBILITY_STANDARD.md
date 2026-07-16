# Accessibility standard

Target WCAG 2.2 AA, with a project preference of 44×44 CSS-pixel controls beyond the 24×24 AA minimum. Accessibility is an architecture gate, not final polish. Normative basis: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

## Interaction

- Complete every flow with keyboard and touch; no trap; logical focus order; visible/non-obscured focus.
- Dialogs use dialog semantics, labelled title, initial focus, focus trap, Escape where safe, and focus restoration.
- Dragging, gestures, hover, precision timing, and audio always have a single-pointer/keyboard/text alternative.
- Preferred targets ≥44×44; controls expose name, role, value, selected/expanded/disabled state and reason.
- Progressive unlocks move focus only when required; otherwise announce batched status and keep user context.

## Perception and layout

- Meaning never relies on color, shape, position, motion, or audio alone.
- Text/controls meet contrast; forced colors/high contrast remain operable; typography scales to 200% and supports 400% browser zoom/reflow and WCAG text-spacing overrides.
- Mobile portrait works at 390×844 without page-level horizontal scroll. Wide math/graphs use contained scroll plus text alternative.
- Respect `prefers-reduced-motion`; pause/disable nonessential movement; no flashes.

## Mathematics and visualizations

Store vetted TeX plus plain-language meaning. Render KaTeX `htmlAndMathml`, `trust:false`, with reviewed fallback; do not duplicate MathML with an aria-label or show raw TeX. Self-host eventual assets. SVG/chart has title/description and adjacent structured list/table/data alternative. Test representative notation with NVDA/Firefox, NVDA/Chrome, VoiceOver/Safari, and TalkBack/Chrome.

## Dynamic content

Use throttled polite `role=status` for purchases, unlocks, saves, completions, offline summary availability, and errors. Passive rates/ticks never enter live regions. Errors identify control, reason, and recovery. Timeout content can be paused/dismissed and never carries essential-only information.

## Gate

Automated axe/lint may have no serious/critical violations, but manual keyboard, touch, zoom/reflow, reduced-motion, forced-colors, screen-reader, focus, math, and cognitive-load review remains required. Record known limitations rather than claiming automated conformance.


# Design tokens

Phase 0 prototype values are a direction, not final brand assets.

```css
--color-paper: #f7f4ea;
--color-surface: #fffdf7;
--color-ink: #17221f;
--color-muted: #54625d;
--color-line: #c8d1c9;
--color-action: #155d51;
--color-action-soft: #dbece5;
--color-warning: #8a4b08;
--color-focus: #b54708;
--space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem;
--radius-control: .55rem; --radius-panel: .9rem;
--target-preferred: 44px;
--motion-fast: 120ms; --motion-medium: 220ms;
```

Typography: system sans for controls/data; highly legible serif for major mathematical/results headings; tabular numerals for rates. Minimum body 16px; supports 200% zoom and WCAG text spacing without loss. Lines/icons remain ≥3:1 against adjacent colors; text targets WCAG AA. Focus uses a visible ≥3px ring independent of color state.

Spacing uses 4px base and content widths 45–75 characters. Motion is transform/opacity only where possible and collapses to near-zero under `prefers-reduced-motion`. Forced-colors preserves borders/focus/semantic labels.


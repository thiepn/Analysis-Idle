# Phase 0 accessibility audit

## Legacy v1

`PARTIAL / historical only`: semantic headings/buttons exist, but the completion overlay is a section rather than a dialog; focus is not moved/trapped/restored and Escape is absent; timed dismissal can hide content; ASCII mathematics lacks structured semantics; no reduced-motion/forced-colors rules; full UI refresh risks excessive live/dynamic churn; some controls fall below the project 44px target. See `index.html:87-108`, `ui/notifications.js:14-57`, and `style.css`.

## Phase 0 prototype

Static/code audit passes: skip link; semantic landmarks/headings/buttons/radios/progress; labeled allocation controls; 44px targets; no required drag/timing; list alternative to SVG; title/description; color-independent text state; responsive 390px layout; reduced motion; visible focus. The consistency audit removed a contradictory third lane and added disabled allocation states, pressed preset state, and project progress labeling.

Known limitations: no real dialog/focus-restoration flow; no KaTeX expression yet; no automated axe runner in Phase 0 dependencies; no NVDA/VoiceOver/TalkBack session; forced-colors and 400% zoom need manual browser evidence. The prototype demonstrates architecture but does not claim WCAG conformance.

## Required Phase 1 follow-up

Add automated axe/keyboard smoke tests, representative KaTeX MathML tests, dialog focus tests, browser/AT sessions, text-spacing/zoom/forced-color screenshots, and status-announcement throttling tests before production UI acceptance.


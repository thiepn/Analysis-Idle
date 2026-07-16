# Performance budgets

Initial targets (measure on throttled low-end mobile and representative saves):

- application JS ≤100KiB gzip; entry ≤75KiB; CSS ≤25KiB; initial shell excluding fonts/images ≤200KiB;
- engine advance p95 ≤2ms at 10Hz; ordinary UI commit p95 ≤16ms; no routine tick task ≥50ms;
- passive render 4–10Hz maximum, no full-tree animation-frame updates, no live-region tick announcements;
- save serialize+write p95 ≤8ms; envelope hard limit 250KiB;
- typical offline reconciliation ≤100ms; yield/show progress above 200ms; bounded event/iteration ceiling;
- LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 targets; Lighthouse mobile performance ≥90/accessibility 100 as automated signals.

KaTeX/chapter-heavy content load lazily and its JS/CSS/fonts report separately. Reports record device/throttle/build/content/save/config. Budgets are draft gates until Phase 1 produces real bundles/benchmarks.


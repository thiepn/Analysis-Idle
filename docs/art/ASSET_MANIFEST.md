# Asset manifest

## Schema

Every asset record contains: stable ID, name, type, chapter, purpose, source file, export file, dimensions, format, creator, creation tool, license, source, AI-generation prompt (or `null`), modification history, accessibility fallback, status, and checksum.

## Initial planned assets

| ID | Type/purpose | Format/production | Accessibility fallback | Status |
|---|---|---|---|---|
| `brand.logo.primary` | product identity | authored SVG | text “Analysis Idle” | brief only |
| `brand.app-icon` | install/favicon | SVG source → PNG sizes later | product name | deferred |
| `resource.precision` | stock symbol | authored SVG, square/ruled mark | label “Precision” | planned |
| `resource.intuition` | stock symbol | authored SVG, open lens mark | label “Intuition” | planned |
| `system.attention` | capacity token | CSS/SVG | “Attention slot” + value | prototype |
| `system.insight` | stored action | authored SVG | “Insight charge” + value | planned |
| `system.publication` | transformation | authored SVG/seal | “Publication available/published” | planned |
| `chapter.nn.seal` | Natural Numbers archive | authored SVG | “Natural Numbers published” | planned |
| `nn.induction-chain` | state-driven mechanic | generated semantic SVG | ordered-list alternative | prototype |
| `achievement.frame.*` | badge hierarchy | reusable SVG frame | badge name/category/state | deferred |

No final license is selected on behalf of the owner. Every externally sourced/AI-assisted asset remains unusable until provenance and license are recorded.


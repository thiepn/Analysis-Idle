# Browser and assistive-technology matrix

Target current stable and previous major where practical:

| Platform | Browsers | Required |
|---|---|---|
| Windows 11 | Chrome, Edge, Firefox | engine/save/UI/keyboard; NVDA with Firefox + Chrome |
| macOS current | Safari, Chrome, Firefox | engine/save/UI/keyboard; VoiceOver + Safari |
| iOS/iPadOS current | Safari | touch, reflow, page lifecycle, VoiceOver |
| Android current | Chrome, Firefox | touch, lifecycle/storage; TalkBack + Chrome |

Also test private mode/storage denial, quota error, offline/online, bfcache, background/restore, two tabs, 200%/400% zoom, landscape/portrait, reduced motion, forced/high contrast, coarse pointer, and slow CPU. GitHub Pages release candidate runs from its actual base path. Unsupported embedded browsers receive a clear export-first warning rather than silent data loss.


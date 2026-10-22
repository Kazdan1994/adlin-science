---
target: web app booking page
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/arthurjacquemin/Projects/adlin-science/apps/web/app/pages/index.vue"
target_fingerprint: "sha256:d98e80a6eaacdfeae39d853a47a34e481ec8b06ca6ba25b89f66629d028a5abe"
target_path: /Users/arthurjacquemin/Projects/adlin-science/apps/web/app/pages/index.vue
timestamp: 2026-10-22T09-23-48Z
slug: apps-web-app-pages-index-vue
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | "Available rooms" never names the slot it reflects; "Confirm booking" only fades while submitting |
| 2 | Match System / Real World | 3 | Plain copy, Paris time labelled; "(CET/CEST)" is jargon |
| 3 | User Control and Freedom | 3 | Cancel, Esc, Clear filters all work; "Book another room" drops focus to body |
| 4 | Consistency and Standards | 2 | Filters apply live, date/time need an explicit Search |
| 5 | Error Prevention | 2 | Past start times offered for today; seats > 26 accepted |
| 6 | Recognition Rather Than Recall | 2 | User must remember which slot the list was searched for |
| 7 | Flexibility and Efficiency | 2 | 96-option Start select, ~50-option End select, no duration presets |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, but three equal-weight white cards; Search and five Book buttons share one blue |
| 9 | Error Recovery | 3 | Inline, specific messages; conflict names the room |
| 10 | Help and Documentation | 2 | Only the seats hint and the Paris-time line |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict
LLM: category-interchangeable. Stock Tailwind (slate-50, white bordered cards, blue-700, system font, main.css is only `@import "tailwindcss"`). Only the Paris-time label and equipment chips are product-specific. The slot, the one fact that matters, is never shown as the subject of the results.
Deterministic scan: source scan 0 findings (regex-only, undercount). URL scan at 1280 and 360: 1 advisory low-contrast, FilterPanel.vue:58 placeholder "Any" #878b95 on #fff = 3.4:1. Real, low impact. Overlay: blocked by the app's CSP (script-src 'self' + hashes); no overlay.

## Priority Issues
- [P1] Form and results drift apart. SearchForm keeps local refs and only emits on Search (SearchForm.vue:20-22, 43-54); list and dialog use the last searched slot (index.vue:22-26). Change date, skip Search, dialog books the old date. Fix: search on change (debounced) or show searched slot in results heading and mark list stale when form is dirty. /impeccable harden
- [P1] Past start times offered for today. startTimeOptions(date) lists the full day (SearchForm.vue:26); error only after Search. Fix: filter past slots when date is today. /impeccable harden
- [P2] Empty state has no action (EmptyState.vue:6-10). Add Clear filters button when filtered; say largest room seats 26 when seats exceed max. /impeccable onboard
- [P2] Invalid seats value keeps previous filter (FilterPanel.vue:26-29). Input and results disagree. /impeccable harden
- [P2] Weak submit feedback and lost focus (BookingDialog.vue:77-83, index.vue:52). Label "Booking…"; focus Date or results heading after "Book another room". /impeccable polish
- Design character (no P-tag; brief bonus "decent design"): generic look. /impeccable bolder or typeset+colorize, after the P1s.

## Persona Red Flags
- Jordan: expects list to follow date change; first Book button below fold at 360px.
- Sam: "1 rooms available." (RoomList.vue:16); focus to body after Book another; redundant role=dialog aria-modal on native <dialog> (BookingDialog.vue:37-38); 96-item select.
- Riley: wrong-slot booking via skipped Search; seats over max; non-applied invalid filter.
- Adlin reviewer: stale-slot dialog reads as a correctness bug; no on-screen signal of the race guarantee; visuals "fine", not "decent design".

## Minor Observations
- 360px dialog wraps "16:15–" / "17:00"; use nowrap.
- Disabled Clear filters at 60% opacity looks broken.
- Confirmation card above form pushes list ~300px down.
- Descriptions hidden (they duplicate names); fine if deliberate.
- "(CET/CEST)" subtitle: drop, "Paris time" is enough.

## Questions to Consider
- What if the results header were the slot ("Free Tue 27 Oct, 16:15–17:00 · 4 rooms") and the list updated live?
- Would duration chips (30 min, 1 h, 2 h) beat a 50-option End select?
- If "free means bookable" is the guarantee, why does the UI never show it?

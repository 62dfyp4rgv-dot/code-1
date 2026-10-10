# UX report — Football Universe mobile app (iPhone-class, via web export)

Reviewer: UX/product polish pass. Method: `npm run export:web` + `node e2e/run.mjs` (Chromium, 393x852 @2x and 320x568, light/dark, EN/AR), every screenshot in `docs/screenshots/` inspected, plus a DOM tap-target audit (see below).
**Not verified on any device or simulator.** Safe areas / Dynamic Island, haptics, native transitions, Hermes performance and native RTL mirroring have only been reasoned about and compile-checked (`expo export --platform ios` succeeds). The baseline ("before") screenshots were overwritten by the re-run; they live in git history under the same file names.

## Ranked findings

Status: **Fixed** = changed in this pass and re-checked in the e2e; **Open** = still a gap.

| # | Sev | Screen | Evidence (screenshot) | Problem | Fix / status |
|---|-----|--------|-----------------------|---------|--------------|
| 1 | High | Home (first run) | `05-home` (baseline) | After picking a club the only guidance was an undifferentiated stack of four equal-weight buttons; nothing said *what to do first*, who the next opponent is or when. | **Fixed.** Hero card: date, window status, next opponent with crests + countdown ("in 19 days", Home/Away), one dominant *Play to next match* button (y < 852 asserted), small +1 day / +1 week / End season row. First-run "Welcome, manager" checklist (squad, tactics, market if the window is open) replaced by the season glance after the first match. `05-home`, `05b-home-first-run-320` |
| 2 | High | Play -> result | `18-after-sim` (baseline) | Pressing *Play to next match* silently returned to Home with a one-line banner "Simulated 20 days (69 matches)". The payoff of the core loop (your result) was a row further down. | **Fixed.** When your club played (next match / +1 day) the app opens the match centre in live-reveal mode. |
| 3 | High | Match centre | `19-match-summary` (baseline) | Static table of numbers; no sense of a match. | **Fixed.** Animated reveal (~9 s): LIVE clock, score ticking up with a spring pulse, goal/card slide-ins into a "Key moments" feed, half-/full-time markers, progress track with goal markers, Pause / Skip, Replay, Reduce-Motion respected, spoilers (goals list, stats) hidden while playing, goal announcements for VoiceOver. `19a`..`19d`, `37b`, `41b`. **Honest caveat:** the match is simulated up front by the engine; this is a presentation of the recorded events, there are no in-match decisions. |
| 4 | High | Squad / Market | `06-squad`, `08-market` (baseline) | Search field rendered as an empty box (no placeholder, no icon); 2-3 rows of wrapping filter + sort chips pushed the first player below the fold; Tactics/Lineup buttons were 36 pt tall. | **Fixed.** Pill search field with icon + placeholder; single-line horizontally scrolling filter and sort rows; header buttons 44 pt. |
| 5 | Med | Home | `44-home-dark` (baseline) | No quick-glance visuals: form and position were only discoverable in the full table. | **Fixed.** "Season so far" card: league position with trend arrow, SVG rank sparkline (react-native-svg), last-5 W/D/L chips (letter + colour, tappable -> match report) with points. W/D/L badge on every result row. |
| 6 | Med | Tactics / Lineup | `22-tactics` (baseline) | Role labels overlapped the next row of player markers (LW/RW vs ST); long names clipped with no backing. | **Fixed (partly).** Taller pitch, re-spaced lines, label pills with dark backing. Long role names ("Central m...", "Centre-b...") are still truncated on 5-across lines. **Open** (minor). |
| 7 | Med | App-wide | all | No haptics, no scale/press feedback, transitions disabled (`animation: 'none'`) on every platform. | **Fixed (unverified on device).** `expo-haptics` through a safe wrapper (no-op on web / when disabled in Settings / on error): selection on chips, tabs, switches, steppers, sliders; light impact on primary buttons; success/warning/error on simulation, bids, goals, full time. Press scale 0.96-0.97, fade-in cards. Native stack uses the platform slide, tabs fade (web stays `none` for stable tests). Haptics toggle in Settings. |
| 8 | Med | Tab roots | `07-fixtures` etc. | Compact header bar on tab roots; no hierarchy between tab title and content. | **Fixed.** iOS-style 34 pt large titles on tab roots; pushed screens keep the compact back-bar header. |
| 9 | Med | Home | `18a-confirm-end-season` | *Simulate to end of season* sat one tap from *+1 week* with no confirmation. | **Fixed.** Confirmation sheet. |
| 10 | Med | Notices | code review | Toast was positioned at `top: 8`, i.e. under the notch / Dynamic Island on iPhone 15. | **Fixed** (safe-area inset added). Unverified on device. |
| 11 | Med | Match (RTL) | `37b-match-reveal-arabic-rtl` | Mixed-direction score text reorders Arabic-Indic digits unpredictably. | **Fixed.** Score rendered as three LTR flex items in visual order (home on the right in RTL, matching the mirrored crests). |
| 12 | Low | 320 px | `41-home-320`, `05b` | Three-button row truncated ("+1 we..."), opponent names broke mid-word. | **Fixed.** Narrow-width text sizing; single-line fit buttons. |
| 13 | Low | Contrast | tokens | Draw colour (#6B7A72) with white letter was 4.4:1; old 9 px form dots unreadable. | **Fixed.** Darker draw colour, 13 px letters in 32 pt chips, unit test asserts AA for W/D/L chips in both themes. |
| 14 | Low | Tap targets | audit | Segmented control rows were 38 pt, search input 41 pt. | **Fixed.** Audit: no interactive element visible on home / squad / fixtures / market / match / more at 393x852 or 320x568 is under 44 px except the 32 px form chips and a few `small` buttons that carry hitSlop (not measurable in the web DOM). |

## Remaining gaps (Open)

* Player rating pills and some list text ignore the "Arabic digits" setting; fixture titles (`Home 3-2 Away`) are plain mixed-direction strings and can reorder in RTL.
* Engine-authored text (timeline tab event descriptions, news) is English-only, also in the Arabic UI.
* No skeleton/progress for world generation beyond a spinner (the JS thread blocks for seconds on phones).
* The League-position sparkline is reconstructed from fixtures (3-1-0 points, GD, GF); the engine stores no history. The latest point is pinned to the engine's real position. Tie-break rules beyond that are not modelled.
* No pull-to-refresh: all data is local, there is nothing to refresh, so none was added.
* Lineup/tactics validity is only surfaced inside those screens; Home does not warn about an invalid XI before *Play*.
* Player profile and finances remain dense lists; table promotion/relegation zones are still not shown (engine exposes none).
* Dynamic Type beyond the in-app text-size slider (OS font scaling) and VoiceOver flow were never exercised on a device.

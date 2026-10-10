# Scorecard (self-assessed, evidence-bound)

**Verdict: the release gate (overall ≥ 9.0, every dimension ≥ 8.0) is NOT met, and this document does not claim it is.**
Scores are the author's judgement from the evidence listed; they are not independently validated. Where evidence is missing, the score is capped.

| Dimension | Score | Evidence | Why not higher |
|---|---|---|---|
| Match engine realism & calibration | 7.5 | Monte Carlo bands in `test/calibration.test.ts`; stats reconcile with events; tactical lever/matrix tests | Targets are recalled approximations, not validated against licensed data; stacked tactics gave +0.14..0.20 goals (CR-009, open); goal rate depends on absolute level (CR-018) |
| Tactics (measurable consequences) | 7.0 | Single-lever, archetype, formation tests plus a 100-config random stack sweep (worst re-test ≈+0.11 goals/match, was +0.14..+0.20) | A residual stack advantage remains (direct+press+deep line); 4-2-3-1 ≈+0.10 vs 4-3-3 |
| Competition engine | 8.0 | Invariants swept over every registered competition (now 35+22 leagues, 10 pyramids, 55+ cups/super cups, 5 new continental/intercontinental trophies); two-season Extended-world test with promotion/relegation incl. a human club; recursive tiebreakers; league-phase 1-factorisation | Rule values are unverified scenario defaults; `minHomegrown`, `resetAfterRound`, knockout `penalties` configured but not enforced (CR-012); league-phase format silently changes for entrants not divisible by 4 (CR-013). Fixed this round: favourite-always-hosts (CR-008) |
| World dynamics (transfers, finance, development) | 6.5 | 8–10 season runs with zero invariant violations; ledger identity enforced | Mean ability drifts down ~1.6 over 8 seasons, title concentration in some leagues (CR-010); uncapped automatic borrowing (CR-011); richest club hoards cash (QA-008); managers almost never sacked (QA-016) |
| Persistence & integrity | 7.5 | Atomic revisions, checksum + fallback, parameterised SQL; this round: untrusted-input validation, prototype-safe lookups, byte-bounded chunks (≤1 MB test), replay snapshots, retired-player purge; 16 new regression tests | Never executed on a real device/`expo-sqlite`; row-limit assumption (≈2 MB Android) unverified; load-time cost of validation on the standard preset not measured |
| Engineering quality / tests | 7.5 | 421 engine tests (18 files), lint and `tsc` clean, independent QA suite (142 tests) and adversarial critic report | 20 QA tests still fail by design (open defects); import cycle and 1,350-line `match.ts` (CR-020) |
| Mobile app (iPhone) | 6.5 | `tsc` clean; 71 unit tests; web export e2e 148 assertions / 0 failures at 393×844 and 320 px (re-run by the lead); real-names/data-pack/crest import and Extended world options; iOS Hermes bundle compiles (`expo export --platform ios`); first-run Home, animated match reveal, haptics, large titles, UX report | **Never run on an iPhone or simulator** (no Xcode here): safe areas, haptics, native transitions, VoiceOver, expo-sqlite saves unverified; no in-match decisions; some Arabic digit/RTL gaps |
| Localisation / RTL / accessibility | 5.5 | EN/AR, RTL e2e screenshots, 44 px tap audit on web, Reduce Motion | Engine text English-only; Arabic digits gaps; no screen-reader test |
| Documentation honesty | 8.0 | LIMITATIONS, DATA_AND_LICENSING, review reports, ledger | SCORECARD figures are self-assessed |

**Overall (unweighted mean of the above): ≈ 7.1 / 10.** (Persistence is 7.5; CR-007 is fixed.) The brief's weights were not re-derived here; a weighted mean would not change the conclusion that several dimensions are below 8.0.

## Not verified in this environment
Native iOS/Android builds, `expo-sqlite` adapter, real-device performance, real-world calibration data, long (30-season) standard-preset runs, UX of the mobile app.

## Open findings after this round
Critic: CR-009 (reduced, residual), CR-010..CR-022 (CR-013 league-phase note and CR-012 unenforced rules still open); QA: QA-008, QA-011, QA-012 (partly addressed by the purge), QA-013 (= CR-007), QA-016. See `docs/reviews/`.

## Data honesty
Real club/competition names, ~30 starter squads and approximate FC 26-era ratings are optional overlays written from the authors' recollection: unverified, not EA data, no logos bundled (users import their own). Default worlds remain fictional.

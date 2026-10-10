# Scorecard (self-assessed, evidence-bound)

**Verdict: the release gate (overall ≥ 9.0, every dimension ≥ 8.0) is NOT met, and this document does not claim it is.**
Scores are the author's judgement from the evidence listed; they are not independently validated. Where evidence is missing, the score is capped.

| Dimension | Score | Evidence | Why not higher |
|---|---|---|---|
| Match engine realism & calibration | 7.0 | Monte Carlo bands in `test/calibration.test.ts`; stats reconcile with events; tactical lever/matrix tests | Targets are recalled approximations, not validated against licensed data; stacked tactics gave +0.14..0.20 goals (CR-009, open); goal rate depends on absolute level (CR-018) |
| Tactics (measurable consequences) | 6.5 | Single-lever, archetype and formation tests | Stacked-lever free upgrade still open (CR-009) |
| Competition engine | 7.5 | Invariants verified for all 80 registered definitions; recursive tiebreakers; league-phase 1-factorisation | Rule values are unverified scenario defaults; `minHomegrown`, `resetAfterRound`, knockout `penalties` configured but not enforced (CR-012); league-phase format silently changes for entrants not divisible by 4 (CR-013). Fixed this round: favourite-always-hosts (CR-008) |
| World dynamics (transfers, finance, development) | 6.5 | 8–10 season runs with zero invariant violations; ledger identity enforced | Mean ability drifts down ~1.6 over 8 seasons, title concentration in some leagues (CR-010); uncapped automatic borrowing (CR-011); richest club hoards cash (QA-008); managers almost never sacked (QA-016) |
| Persistence & integrity | 7.5 | Atomic revisions, checksum + fallback, parameterised SQL; this round: untrusted-input validation, prototype-safe lookups, byte-bounded chunks (≤1 MB test), replay snapshots, retired-player purge; 16 new regression tests | Never executed on a real device/`expo-sqlite`; row-limit assumption (≈2 MB Android) unverified; load-time cost of validation on the standard preset not measured |
| Engineering quality / tests | 7.5 | 262+ engine tests, lint and `tsc` clean, independent QA suite (142 tests) and adversarial critic report | 20 QA tests still fail by design (open defects); import cycle and 1,350-line `match.ts` (CR-020) |
| Mobile app | 3.0 | Screens, saves core and an e2e harness exist in `apps/mobile` | The builder agent stopped on a rate limit; typecheck/web export/e2e/screenshots were **not** run by the lead; no native build (no SDK here); no UX review done |
| Localisation / RTL / accessibility | 3.0 | Present in code per the builder's notes | Unverified end to end |
| Documentation honesty | 8.0 | LIMITATIONS, DATA_AND_LICENSING, review reports, ledger | SCORECARD figures are self-assessed |

**Overall (unweighted mean of the above): ≈ 6.3 / 10.** The brief's weights were not re-derived here; a weighted mean would not change the conclusion that several dimensions are below 8.0.

## Not verified in this environment
Native iOS/Android builds, `expo-sqlite` adapter, real-device performance, real-world calibration data, long (30-season) standard-preset runs, UX of the mobile app.

## Open findings after this round
Critic: CR-006 (fixed, test pending), CR-007, CR-009..CR-022 except CR-008; QA: QA-008, QA-011, QA-012 (partly addressed by the purge), QA-013 (= CR-007), QA-016. See `docs/reviews/`.

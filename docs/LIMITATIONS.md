# Limitations and outstanding work

Grouped by the categories the final report uses: **partial**, **missing**, **unverifiable here**.

## Data and rules
* All clubs, players and managers are **fictional**; no real-world data, crests, logos or photographs. Real-world accuracy is not claimed anywhere.
* Competition formats, tie-breakers, qualification slot counts, squad-registration limits (incl. the Saudi Pro League foreign-player cap of 10), financial-regulation ratios, broadcast pools and prize money are **unverified scenario defaults** (flagged in data and UI). Qualifying rounds are not simulated: vacant places are filled by club reputation.
* Calibration targets are approximate figures recalled by the authors; no licensed dataset was used to fit or validate them.

## Simulation scope
* The match engine is event/possession based, not spatial: no pitch coordinates, no animation, no individual duels beyond what feeds the statistics.
* Calendar: a 364-day cycle starting 1 August; calendar-year leagues (Brazil, MLS) run inside the same cycle; weather is a coarse per-match condition; no international breaks beyond skipped league weeks; national teams do not exist.
* No reserve/youth competitions (academy players are prospects inside the senior club, not a youth league); no stadium building, sponsorship negotiation, agent personalities, team talks, board requests beyond reputation/expectation effects, or work-permit regime.
* AI clubs do not initiate bids for the *human* club's players unless they are transfer-listed.
* Financial model is aggregate (weekly flows, ledger categories); it is not a licensed-regulation model.

## Platforms
* **Native iOS/Android binaries were not built or run** (no Android SDK/Xcode/device available). The `expo-sqlite` adapter is unexecuted on a device. The UI is verified through the web export of the same code (see `apps/mobile/STATUS.md`).
* Performance on real phones is unmeasured. Desktop reference: compact world ≈ 12–15 s per simulated season; standard world (~550 clubs) ≈ 45 s on a contended 4-core machine. The app runs simulation in cancellable chunks.
* No online features, multiplayer, accounts, analytics or cloud sync.

## Process
* Independent reviews (QA and adversarial critic) were performed by separate agents and their findings are in `docs/reviews/`; those findings that were fixed are listed in `docs/LEDGER.md`; unfixed ones remain listed in the reports.
* The weighted quality score in `docs/SCORECARD.md` is derived from the evidence above; it does not claim the 9.0 target if the evidence does not support it.

# Risk register

| ID | Risk | Likelihood | Impact | Mitigation / status |
|---|---|---|---|---|
| K1 | Competition rules/slots differ from reality | High | Medium | Labelled unverified in data + UI; data-driven so it can be replaced; documented |
| K2 | Simulation too slow on phones (full season of ~550 clubs) | Medium | High | Chunked, cancellable sim in UI; compact preset default; profiling done; further optimisation listed in TASKS |
| K3 | Statistical drift over many seasons | Medium | High | Long-run regression test; ledger entries LR-1..LR-4 document fixed drifts |
| K4 | Save corruption / app killed during save | Medium | High | Transactional revisions + checksum + fallback; tested incl. interruption |
| K5 | Save-size growth (news, transfers, history) | Medium | Medium | Ring-buffer pruning of matches/news/transfers; growth measured in QA report |
| K6 | Non-determinism after load (ordering) | Medium | High | Canonical ordering of derived indexes; regression test |
| K7 | Tactical meta collapses to one dominant style | Medium | High | Matrix tests; ledger TB-1..TB-3 |
| K8 | Native build / device-specific failures unseen | High | High | Not verifiable here; web build verified; STATUS.md lists unverified items |
| K9 | Licensing of real data/assets if added later | Low | High | Fictional data only; provider checklist in DATA_AND_LICENSING.md |
| K10 | Expo/RN API drift (very new SDK) | Medium | Medium | Pinned versions from `bundledNativeModules.json`; verified by typecheck + web export |

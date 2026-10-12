# Modifier system

All numeric bonuses from technologies, events, policies and treaties are expressed as **additive modifiers keyed by name** on a country
(`c.mc[key]`, rebuilt from technologies plus timed modifiers `c.mods`). Systems read them through two helpers in `mods.js`:

- `modv(c, k)` — the absolute modifier value.
- `modd(c, k)` — the value **relative to the scenario-start snapshot** (`c.mc0`). Production and demand equations use this so that
  the t0 calibration (which already embeds each country's starting technology) stays exact and only *changes* move the economy.

Timed modifiers (`addTimedMod(c, key, value, untilDay, source)`) expire automatically and keep their `src` for display.
`tests/unit/data.test.js` fails if any technology effect key is not read by simulation code, so there is no dead content.

| Key | Meaning (unit: fractional change unless noted) | Main consumer |
|---|---|---|
| `tfp.agri/industry/oil/gas/mining/utilities/services/tech` | sector total-factor productivity | `economy.productionStep` |
| `energy.clean_rate`, `energy.eff`, `emis.int` | clean-electricity build rate, energy efficiency, emissions intensity | economy, society |
| `min.recycle` | mineral demand reduction | `economy.commodityDemand` |
| `health.rate`, `edu.rate`, `infra.eff` | speed/efficiency of service indices | society |
| `research.eff` | research output | research |
| `trade.eff`, `trade.access` | trade friction / access | trade |
| `tax.eff`, `admin.cap` | tax collection efficiency, state capacity | economy, politics |
| `agri.water`, `water.supply` | irrigation/resilience | economy, society |
| `disaster.resil`, `epid.resp` | disaster damage and epidemic response | events, society |
| `info.def`, `cyber.def`, `ci.eff`, `intel.eff` | information/cyber defence, counter-intelligence, intelligence | intel |
| `mil.land/air/sea/logi/recon/cyber_off/air_def/mobil` | military quality by branch, logistics, recon, offensive cyber, air defence, mobility | military, war |
| `stab.add`, `approval.add`, `unrest.add` | additive stability/approval/unrest per month | politics |
| `gdp.shock`, `invest.conf`, `cons.conf`, `infl.add` | demand/confidence shocks, additive inflation | economy |

Adding a modifier: add the key to `MODIFIER_KEYS`, read it in the owning system via `modd`/`modv`, reference it in `techs.psv` or `events.json`.

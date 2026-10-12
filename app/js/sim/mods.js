// Modifier system: permanent technology effects + timed temporary modifiers, keyed by string ("tfp.industry", "mil.land", ...).
// Documented in docs/MODIFIERS.md; every key a tech or event can emit must be consumed by a sim module (tests enforce this).
export const MODIFIER_KEYS = [
  'tfp.agri',
  'tfp.industry',
  'tfp.oil',
  'tfp.gas',
  'tfp.mining',
  'tfp.utilities',
  'tfp.services',
  'tfp.tech', // productivity level (+x = +x*100%)
  'energy.clean_rate',
  'energy.eff',
  'emis.int',
  'min.recycle', // energy transition / efficiency / emissions / mineral demand
  'health.rate',
  'edu.rate',
  'research.eff',
  'infra.eff',
  'trade.eff',
  'tax.eff',
  'admin.cap',
  'agri.water',
  'water.supply', // state capacity / society
  'disaster.resil',
  'epid.resp',
  'info.def',
  'cyber.def',
  'ci.eff',
  'intel.eff', // resilience & security
  'mil.land',
  'mil.air',
  'mil.sea',
  'mil.logi',
  'mil.recon',
  'mil.cyber_off',
  'mil.air_def',
  'mil.mobil', // military
  'stab.add',
  'approval.add',
  'gdp.shock',
  'trade.access',
  'invest.conf',
  'unrest.add',
  'cons.conf',
  'infl.add', // event-driven only
];
export function refreshMods(c, day) {
  const mc = Object.create(null);
  for (const [k, v] of Object.entries(c.techMods)) mc[k] = v;
  if (c.mods.length) {
    c.mods = c.mods.filter((m) => m.until == null || m.until > day);
    for (const m of c.mods) mc[m.k] = (mc[m.k] || 0) + m.v;
  }
  c.mc = mc;
}
export const modv = (c, k) => c.mc[k] || 0;
export function addTimedMod(c, k, v, untilDay, src = '') {
  c.mods.push({ k, v, until: untilDay, src });
  c.mc[k] = (c.mc[k] || 0) + v;
}
export function recomputeTechMods(c, data) {
  const t = Object.create(null);
  for (const id of c.tech.known) {
    const tech = data.techById[id];
    if (!tech) continue;
    for (const e of tech.effects) t[e.k] = (t[e.k] || 0) + e.v;
  }
  c.techMods = t;
}

// Delta versus the calibrated start state. Level-type modifiers use this so that a country's initial technology is already
// "baked in" to its calibrated productivity, and only NEW techs / temporary effects change the simulation.
export const modd = (c, k) => (c.mc[k] || 0) - (c.mc0[k] || 0);
export function snapshotBase(c) {
  c.mc0 = { ...c.mc };
}

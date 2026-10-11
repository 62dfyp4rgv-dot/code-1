// Shared enumerations and tuning constants. Every number that shapes balance lives here or in data files.
export const COMMODITIES = ['food', 'oil', 'gas', 'minerals'];
export const SECTORS = ['agri', 'industry', 'oil', 'gas', 'mining', 'utilities', 'services', 'tech'];
export const SECTOR = Object.fromEntries(SECTORS.map((s, i) => [s, i]));
export const COM = Object.fromEntries(COMMODITIES.map((s, i) => [s, i]));
// alpha = capital share, v = capital/output ratio, delta = depreciation, g = baseline TFP growth/yr
export const SECTOR_PARAMS = {
  agri:      { alpha: 0.30, v: 2.0, delta: 0.04, g: 0.005 },
  industry:  { alpha: 0.35, v: 2.8, delta: 0.06, g: 0.006 },
  oil:       { alpha: 0.55, v: 4.5, delta: 0.05, g: 0.002 },
  gas:       { alpha: 0.55, v: 4.5, delta: 0.05, g: 0.002 },
  mining:    { alpha: 0.50, v: 3.5, delta: 0.05, g: 0.003 },
  utilities: { alpha: 0.50, v: 6.0, delta: 0.04, g: 0.003 },
  services:  { alpha: 0.33, v: 2.2, delta: 0.05, g: 0.005 },
  tech:      { alpha: 0.40, v: 2.0, delta: 0.10, g: 0.014 },
};
// World commodity value pools at base price (USD bn/yr), approximate 2023-24 magnitudes. Used to convert world shares to output.
export const WORLD_VALUE = { oil: 2900, gas: 1000, minerals: 1200, agri: 3800 };
export const GOV_TYPES = ['lib_dem', 'flawed_dem', 'hybrid', 'monarchy', 'one_party', 'military', 'theocracy'];
export const GOV_PROFILE = {
  // pcRate: political capital gain multiplier; resist: resistance to policy change; elect: holds competitive elections;
  // coupRisk: baseline coup/revolution propensity when unstable; repress: capacity to repress; tfp: institutional TFP effect;
  // warSupport: ability to sustain wars; corrBase: baseline corruption pressure
  lib_dem:    { pcRate: 1.0, resist: 1.25, elect: true,  coupRisk: 0.02, repress: 0.2, tfp: 0.00, warSupport: 0.8, corrBase: 0.0 },
  flawed_dem: { pcRate: 1.0, resist: 1.1,  elect: true,  coupRisk: 0.05, repress: 0.35, tfp: -0.01, warSupport: 0.9, corrBase: 0.08 },
  hybrid:     { pcRate: 1.1, resist: 0.9,  elect: true,  coupRisk: 0.10, repress: 0.55, tfp: -0.02, warSupport: 1.0, corrBase: 0.15 },
  monarchy:   { pcRate: 1.2, resist: 0.8,  elect: false, coupRisk: 0.05, repress: 0.6, tfp: -0.01, warSupport: 1.0, corrBase: 0.12 },
  one_party:  { pcRate: 1.3, resist: 0.7,  elect: false, coupRisk: 0.04, repress: 0.8, tfp: -0.015, warSupport: 1.2, corrBase: 0.14 },
  military:   { pcRate: 1.2, resist: 0.7,  elect: false, coupRisk: 0.20, repress: 0.7, tfp: -0.03, warSupport: 1.1, corrBase: 0.22 },
  theocracy:  { pcRate: 1.1, resist: 0.8,  elect: false, coupRisk: 0.06, repress: 0.75, tfp: -0.025, warSupport: 1.3, corrBase: 0.14 },
};
export const TERRAIN = {
  plains:   { attack: 1.0,  defense: 1.0,  mobility: 1.0,  supply: 1.0, farm: 0.75 },
  forest:   { attack: 0.9,  defense: 1.2,  mobility: 0.75, supply: 0.85, farm: 0.35 },
  mountain: { attack: 0.7,  defense: 1.6,  mobility: 0.45, supply: 0.6, farm: 0.15 },
  desert:   { attack: 1.0,  defense: 0.95, mobility: 0.9,  supply: 0.6, farm: 0.01 },
  jungle:   { attack: 0.75, defense: 1.35, mobility: 0.5,  supply: 0.6, farm: 0.30 },
  arctic:   { attack: 0.8,  defense: 1.1,  mobility: 0.6,  supply: 0.55, farm: 0.02 },
};
export const POLICY_DEFAULTS = { taxRate: 0.25, spendRate: 0.27, tariff: 0.05 };
export const BUDGET_CATS = ['defense', 'health', 'education', 'infrastructure', 'welfare', 'research', 'admin', 'subsidies'];
export const DAY_FREQ = { monthly: 30 };
export const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));

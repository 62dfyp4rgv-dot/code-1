// Number/text formatting helpers (all pure).
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function money(bn, digits = 1) { // USD billions -> compact string
  const a = Math.abs(bn); const sign = bn < 0 ? '−' : '';
  if (a >= 1000) return `${sign}$${(a / 1000).toFixed(a >= 10000 ? 1 : 2)}T`;
  if (a >= 100) return `${sign}$${a.toFixed(0)}B`;
  if (a >= 1) return `${sign}$${a.toFixed(digits)}B`;
  if (a >= 0.001) return `${sign}$${(a * 1000).toFixed(a >= 0.1 ? 0 : 1)}M`;
  return `${sign}$0`;
}
export const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
export const pctS = (x, d = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(d)}%`;
export const num = (x, d = 0) => (Math.abs(x) >= 1e9 ? (x / 1e9).toFixed(1) + 'B' : Math.abs(x) >= 1e6 ? (x / 1e6).toFixed(1) + 'M' : Math.abs(x) >= 1e3 ? (x / 1e3).toFixed(d || 1) + 'k' : x.toFixed(d));
export function people(m) { return m >= 1000 ? `${(m / 1000).toFixed(2)}B` : m >= 100 ? `${m.toFixed(0)}M` : m >= 1 ? `${m.toFixed(1)}M` : `${(m * 1000).toFixed(0)}k`; }
export const idx100 = (x) => Math.round(x * 100);
export const sgn = (x, d = 1) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);
export const title = (s) => String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const GOV_LABEL = { lib_dem: 'Liberal democracy', flawed_dem: 'Flawed democracy', hybrid: 'Hybrid regime', monarchy: 'Monarchy', one_party: 'One-party state', military: 'Military government', theocracy: 'Theocracy' };
export const REGION_LABEL = { north_america: 'North America', caribbean: 'Central America & Caribbean', south_america: 'South America', western_europe: 'Western Europe', northern_europe: 'Northern Europe', southern_europe: 'Southern Europe', eastern_europe: 'Eastern Europe', russia: 'Russia', central_asia: 'Central Asia & Caucasus', middle_east: 'Middle East', north_africa: 'North Africa', west_africa: 'West Africa', central_africa: 'Central Africa', east_africa: 'East Africa', southern_africa: 'Southern Africa', south_asia: 'South Asia', east_asia: 'East Asia', southeast_asia: 'Southeast Asia', oceania: 'Oceania' };
export function monthYear(sim) { const d = sim.date; return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.m - 1]} ${d.y}`; }
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
// qualitative bands used for color-independent status text
export function band(x, cuts, labels) { for (let i = 0; i < cuts.length; i++) if (x < cuts[i]) return labels[i]; return labels[labels.length - 1]; }
export const GOOD = (x) => band(x, [0.25, 0.4, 0.55, 0.7], ['Critical', 'Poor', 'Fair', 'Good', 'Strong']);
export function trend(x, eps = 0.001) { return x > eps ? '▲' : x < -eps ? '▼' : '►'; }
